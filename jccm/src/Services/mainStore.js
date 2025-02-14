import { app } from 'electron';
import path from 'path';
import Datastore from 'nedb-promises';
import { getActiveThemeName } from '../Frontend/Common/CommonVariables';

// Define the path to the database file
const dbPath = path.join(app.getPath('userData'), 'sessionDB.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

const sessionKey = 'session';
const cloudInventoryKey = 'cloudInventory';
const localInventoryKey = 'localInventory';
const deviceFactsKey = 'deviceFacts';
const subnetsKey = 'subnets';

// Function to get the session
const getSession = async () => {
    let session = await db.findOne({ _id: sessionKey });
    if (!session) {
        session = {
            _id: sessionKey,
            token: undefined,
            cookies: undefined,
            cloudId: undefined,
            regions: undefined,
            activeRegion: undefined,
            userEmail: undefined,
            isUserLoggedIn: false,
            theme: getActiveThemeName('default'),
            cloudOrgs: {},
            orgFilter: {},
            subnets: [],
        };
        await db.insert(session);
    }
    return session;
};

// Replace Keyv functions with NeDB equivalents
export const msSetToken = async (token) => {
    const session = await getSession();
    session.token = token;
    await db.update({ _id: sessionKey }, session);
};

export const msGetToken = async () => {
    const session = await getSession();
    return session.token;
};

export const msSetActiveCloud = async (cloudId) => {
    const session = await getSession();
    session.cloudId = cloudId;
    await db.update({ _id: sessionKey }, session);
};

export const msGetActiveCloud = async () => {
    const session = await getSession();
    return session.cloudId;
};

export const msSetRegions = async (regions) => {
    const session = await getSession();
    session.regions = JSON.stringify(regions);
    await db.update({ _id: sessionKey }, session);
};

export const msGetRegions = async () => {
    const session = await getSession();
    if (session.regions) {
        return JSON.parse(session.regions);
    }
    return undefined;
};

export const msSetActiveRegionName = async (region) => {
    const session = await getSession();
    session.activeRegion = region;
    await db.update({ _id: sessionKey }, session);
};

export const msGetActiveRegionName = async () => {
    const session = await getSession();
    return session.activeRegion;
};

export const msIsUserLoggedIn = async () => {
    const session = await getSession();
    return session.isUserLoggedIn;
};

export const msSetUserEmail = async (userEmail) => {
    const session = await getSession();
    session.userEmail = userEmail;
    await db.update({ _id: sessionKey }, session);
};

export const msGetUserEmail = async () => {
    const session = await getSession();
    return session.userEmail;
};

export const msSetIsUserLoggedIn = async (flag) => {
    const session = await getSession();
    session.isUserLoggedIn = flag;
    await db.update({ _id: sessionKey }, session);
};

export const msSetCookies = async (cookies) => {
    const session = await getSession();
    session.cookies = cookies;
    await db.update({ _id: sessionKey }, session);
};

export const msGetCookies = async () => {
    const session = await getSession();
    return session.cookies;
};

export const msSetTheme = async (theme) => {
    const session = await getSession();
    session.theme = theme;
    await db.update({ _id: sessionKey }, session);
};

export const msGetTheme = async () => {
    const session = await getSession();
    return session.theme || getActiveThemeName('default');
};

export const msSetCloudOrgs = async (orgs) => {
    const session = await getSession();
    session.cloudOrgs = orgs;
    await db.update({ _id: sessionKey }, session);
};

export const msGetCloudOrgs = async () => {
    const session = await getSession();
    return session.cloudOrgs;
};

export const msSetCloudInventory = async (inventory) => {
    await db.update({ _id: cloudInventoryKey }, { _id: cloudInventoryKey, data: inventory }, { upsert: true });
};

export const msGetCloudInventory = async () => {
    const doc = await db.findOne({ _id: cloudInventoryKey });
    return doc ? doc.data : [];
};

export const msGetOrgFilter = async () => {
    const session = await getSession();
    return session.orgFilter;
};

export const msSetOrgFilter = async (orgFilter) => {
    const session = await getSession();
    session.orgFilter = orgFilter;
    await db.update({ _id: sessionKey }, session);
};

export const msSetLocalInventory = async (inventory) => {
    await db.update({ _id: localInventoryKey }, { _id: localInventoryKey, data: inventory }, { upsert: true });
};

export const msGetLocalInventory = async () => {
    const doc = await db.findOne({ _id: localInventoryKey });
    return doc ? doc.data : [];
};

const encodeToBase64 = (obj) => {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
};

const decodeFromBase64 = (str) => {
    return JSON.parse(Buffer.from(str, 'base64').toString());
};

export const msSaveDeviceFacts = async (facts) => {
    const encodedFacts = encodeToBase64(facts);
    await db.update({ _id: deviceFactsKey }, { _id: deviceFactsKey, data: encodedFacts }, { upsert: true });
};

export const msLoadDeviceFacts = async () => {
    const doc = await db.findOne({ _id: deviceFactsKey });
    if (doc && typeof doc.data === 'string') {
        return decodeFromBase64(doc.data);
    }
    return [];
};

export const msSaveSubnets = async (subnets) => {
    console.log('Saving subnets: ', subnets);
    const encodedSubnets = encodeToBase64(subnets);
    console.log('Saving encodedSubnets: ', encodedSubnets);

    await db.update({ _id: subnetsKey }, { _id: subnetsKey, data: encodedSubnets }, { upsert: true });
};

export const msLoadSubnets = async () => {
    const doc = await db.findOne({ _id: subnetsKey });
    if (doc && typeof doc.data === 'string') {
        return decodeFromBase64(doc.data);
    }
    return [];
};
