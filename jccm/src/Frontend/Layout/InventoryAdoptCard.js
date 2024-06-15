import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import validator from 'validator';
import { read, utils, writeFile } from 'xlsx';
import _ from 'lodash';

import {
    Dialog,
    DialogSurface,
    Button,
    Label,
    Link,
    CounterBadge,
    Text,
    Field,
    Toast,
    ToastTitle,
    ToastBody,
    TableBody,
    TableCell,
    TableRow,
    Table,
    TableHeader,
    TableHeaderCell,
    TableCellLayout,
    TableCellActions,
    TableSelectionCell,
    Tooltip,
} from '@fluentui/react-components';
import {
    TrayItemAddRegular,
    DismissFilled,
    DismissRegular,
    DismissCircleFilled,
    DismissCircleRegular,
    AddCircleFilled,
    AddCircleRegular,
    SubtractCircleFilled,
    SubtractCircleRegular,
    CheckmarkCircleFilled,
    CheckmarkCircleRegular,
    ArrowSyncCircleFilled,
    ArrowSyncCircleRegular,
    ChevronCircleLeftFilled,
    ChevronCircleLeftRegular,
    ArrowCircleDownFilled,
    ArrowCircleDownRegular,
    ArrowCircleUpFilled,
    ArrowCircleUpRegular,
    SendFilled,
    SendRegular,
    ShareAndroidFilled,
    ShareAndroidRegular,
    BoxCheckmarkFilled,
    BoxCheckmarkRegular,
    BoxArrowUpRegular,
    BoxRegular,
    OrganizationRegular,
    DirectionsRegular,
    InfoFilled,
    InfoRegular,
    SearchInfoRegular, SearchRegular,    
    bundleIcon,
} from '@fluentui/react-icons';
const { electronAPI } = window;

import * as Constants from '../Common/CommonVariables';
import useStore from '../Common/StateStore';
import { useNotify } from '../Common/NotificationContext';
import { adoptDevices, executeJunosCommand, getDeviceFacts } from './Devices';

const Dismiss = bundleIcon(DismissFilled, DismissRegular);
const AddCircle = bundleIcon(AddCircleFilled, AddCircleRegular);
const SubtractCircle = bundleIcon(SubtractCircleFilled, SubtractCircleRegular);
const CheckmarkCircle = bundleIcon(CheckmarkCircleFilled, CheckmarkCircleRegular);
const ArrowSyncCircle = bundleIcon(ArrowSyncCircleFilled, ArrowSyncCircleRegular);
const ChevronCircleLeft = bundleIcon(ChevronCircleLeftFilled, ChevronCircleLeftRegular);
const ArrowCircleDown = bundleIcon(ArrowCircleDownFilled, ArrowCircleDownRegular);
const ArrowCircleUp = bundleIcon(ArrowCircleUpFilled, ArrowCircleUpRegular);
const Send = bundleIcon(SendFilled, SendRegular);
const ShareAndroid = bundleIcon(ShareAndroidFilled, ShareAndroidRegular);
const GetFactsIcon = bundleIcon(SearchInfoRegular, SearchRegular);
const AdoptDeviceFilled = (props) => (
    <BoxArrowUpRegular
        style={{ fontSize: '18px' }}
        {...props}
    />
);
const AdoptDeviceRegular = (props) => (
    <BoxRegular
        style={{ fontSize: '18px' }}
        {...props}
    />
);
const AdoptDeviceIcon = bundleIcon(AdoptDeviceFilled, AdoptDeviceRegular);

const InventoryAdoptCard = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    const Title = () => <Text size={500}>Device Adoption</Text>;

    const { notify } = useNotify();
    const { currentActiveThemeName, inventory, setInventory } = useStore();
    const inventoryWithPath = inventory.map((item) => {
        const path = `${item.organization}/${item.site}/${item.address}:${item.port}`;
        return {
            ...item,
            path: path,
        };
    });
    const [rowData, setRowData] = useState(inventoryWithPath);
    const [isGettingFacts, setIsGettingFacts] = useState(false);

    useEffect(() => {
        setRowData(JSON.parse(JSON.stringify(inventory)));
    }, [inventory]);

    const columns = [
        {
            headerName: 'No.',
            valueGetter: 'node.rowIndex + 1',
            width: 70,
            pinned: 'left',
        },
        {
            field: 'organization',
            headerName: 'Organization',
            sortable: true,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'site',
            headerName: 'Site',
            sortable: true,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'address',
            headerName: 'IP Address',
            width: '150',
            sortable: true,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'port',
            headerName: 'Port',
            width: '100',
            sortable: true,
            filter: 'agNumberColumnFilter',
        },
        {
            field: 'facts.hardwareModel',
            headerName: 'Hardware Model',
            sortable: true,
            filter: 'agNumberColumnFilter',
        },
        {
            field: 'facts.osName',
            headerName: 'OS Name',
            sortable: true,
            filter: 'agNumberColumnFilter',
        },
        {
            field: 'facts.osVersion',
            headerName: 'OS Version',
            sortable: true,
            filter: 'agNumberColumnFilter',
        },
        {
            field: 'facts.serialNumber',
            headerName: 'Serial Number',
            sortable: true,
            filter: 'agNumberColumnFilter',
        },
        {
            field: 'facts.hostName',
            headerName: 'Host Name',
            sortable: true,
            filter: 'agNumberColumnFilter',
        },
    ];

    const fetchDeviceFacts = async (device) => {
        console.log('Fetching device information: ', device);

        const response = await getDeviceFacts(device);
        if (response.status) {
            console.log(`${device.address} facts:`, response);
            device.facts = response.result;
        } else {
            delete device.facts;
            console.log(`${device.address} facts getting error:`, response);
            notify(
                <Toast>
                    <ToastTitle>Device ({device.address}) Facts Retrieval Failure</ToastTitle>
                    <ToastBody subtitle='Error Details'>
                        <Text>
                            An error occurred while retrieving the device facts. Please check the device configuration
                            and try again.
                        </Text>
                        <Text>Error Message: {response.result.message}</Text>
                    </ToastBody>
                </Toast>,
                { intent: 'error' }
            );
        }
    };

    const getFacts = async (rate = 5) => {
        setIsGettingFacts(true);
        const targetDevices = JSON.parse(JSON.stringify(rowData));
        console.log('targetDevices:', targetDevices);

        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const rateLimit = 1000 / rate; // Rate in calls per second
        const concurrencyLimit = 10; // Maximum number of concurrent async calls

        const executeWithRateLimit = async (items, asyncFunc) => {
            let index = 0;

            const execute = async () => {
                while (index < items.length) {
                    const currentIndex = index++;
                    await asyncFunc(items[currentIndex]);
                    await delay(rateLimit);
                }
            };

            const promises = [];
            for (let i = 0; i < concurrencyLimit; i++) {
                promises.push(execute());
            }

            await Promise.all(promises);
        };

        await executeWithRateLimit(targetDevices, fetchDeviceFacts);
        setIsGettingFacts(false);
        setInventory(targetDevices);
        await electronAPI.saSetLocalInventory({ inventory: targetDevices });
    };

    const adoptDevices = async () => {
        console.log('adopt device button clicked');
    };

    return (
        <Dialog
            open={isOpen}
            onDismiss={onClose}
            modalProps={{ isBlocking: true }}
        >
            <DialogSurface
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    minWidth: 'calc(100% - 20px)',
                    minHeight: `${Constants.AdoptInventoryWindowHeight}px`,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Title />
                    <Button
                        onClick={onClose}
                        shape='circular'
                        appearance='subtle'
                        icon={<Dismiss />}
                        size='small'
                    />
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '10px',
                        justifyContent: 'flex-end',
                        marginTop: '20px',
                    }}
                >
                    <Tooltip
                        content='Retrieve detailed information about the inventory devices'
                        positioning='above'
                    >
                        <Button
                            onClick={async () => getFacts()}
                            shape='circular'
                            appearance='subtle'
                            icon={<GetFactsIcon />}
                            size='small'
                        >
                            Get Device Facts
                        </Button>
                    </Tooltip>
                    <Tooltip
                        content='Initiate the adoption process for the inventory devices'
                        positioning='above'
                    >
                        <Button
                            onClick={async () => adoptDevices()}
                            shape='circular'
                            appearance='subtle'
                            icon={<AdoptDeviceIcon />}
                            size='small'
                        >
                            Adopt Devices
                        </Button>
                    </Tooltip>
                </div>
                <div
                    className={
                        currentActiveThemeName.toLowerCase().includes('dark')
                            ? 'ag-theme-balham-dark'
                            : 'ag-theme-balham'
                    }
                    style={{
                        width: '100%',
                        height: `${Constants.AdoptInventoryWindowHeight + 50}px`,
                        marginTop: '10px',
                    }}
                    id='adoptInventoryGrid'
                >
                    <AgGridReact
                        columnDefs={columns}
                        rowData={rowData}
                        onGridColumnsChanged={(params) => params.api.sizeColumnsToFit()}
                        onGridSizeChanged={(params) => params.api.sizeColumnsToFit()}
                        suppressCellFocus={false}
                        tabIndex={0}
                        onGridReady={(params) => {
                            params.api.sizeColumnsToFit();
                        }}
                    />
                </div>
            </DialogSurface>
        </Dialog>
    );
};

export default InventoryAdoptCard;
