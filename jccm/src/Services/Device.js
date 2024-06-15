import { NodeSSH } from 'node-ssh';
import xml2js from 'xml2js';

export const executeJunosCommand = async (address, port, username, password, cmd, timeout = 5000) => {
    const command = `${cmd} | no-more`;
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: address,
            port: port,
            username: username,
            password: password,
            readyTimeout: timeout,
        });

        const result = await ssh.execCommand(command);

        if (result.stderr) {
            throw new Error(`executeJunosCommand Error: ${result.stderr}`);
        }

        return {
            status: 'success',
            message: 'Command executed successfully',
            data: result.stdout,
        };
    } catch (error) {
        let message = 'Unable to connect to host';
        let status = 'unreachable';
        if (error.message.includes('All configured authentication methods failed')) {
            message = 'Authentication failed. Check your username and password.';
            status = 'auth_failed';
        } else if (error.message.includes('Timed out while waiting for handshake')) {
            message = 'Connection timed out';
            status = 'timeout';
        }
        console.error('executeJunosCommand: error:', error);
        throw { status, message, data: error.message };
    } finally {
        ssh.dispose();
    }
};

export const getDeviceFacts = async (address, port, username, password) => {
    const command = 'show system information | display xml';

    const result = await executeJunosCommand(address, port, username, password, command);

    if (result.status === 'success') {
        try {
            const parser = new xml2js.Parser();
            const parsedResult = await parser.parseStringPromise(result.data);
            const systemInformation = parsedResult['rpc-reply']['system-information'][0];

            const deviceFacts = {
                hardwareModel: systemInformation['hardware-model'][0],
                osName: systemInformation['os-name'][0],
                osVersion: systemInformation['os-version'][0],
                serialNumber: systemInformation['serial-number'][0],
                hostName: systemInformation['host-name'][0],
            };

            return deviceFacts;
        } catch (err) {
            console.log('getDeviceFacts: result: ', result);
            console.error('getDeviceFacts: Error parsing XML:', err);
            throw new Error('getDeviceFacts: Error parsing XML');
        }
    } else {
        throw result;
    }
};

export const commitJunosSetConfig = async (
    address,
    port,
    username,
    password,
    config,
    timeout = 60000,
    inactivityTimeout = 30000
) => {
    // const command = `edit exclusive private\nload set terminal\n${config}\n\x04commit | display xml\nexit\n\n\n`;
    const command = `edit exclusive private\n${config}\ncommit | display xml\nexit\n\n\n`;

    let inactivityTimer;
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: address,
            port: port,
            username: username,
            password: password,
            readyTimeout: timeout,
            timeout: timeout,
        });

        const shell = await ssh.requestShell();
        let data = '';
        let stderr = '';

        const resetInactivityTimer = () => {
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
            inactivityTimer = setTimeout(() => {
                shell.end();
                ssh.dispose();
                return new Error('Session closed due to inactivity');
            }, inactivityTimeout);
        };

        shell
            .on('data', (chunk) => {
                data += chunk.toString();
                resetInactivityTimer();
            })
            .stderr.on('data', (chunk) => {
                stderr += chunk.toString();
                resetInactivityTimer();
            });

        shell.write(command);
        resetInactivityTimer();
        shell.write('exit\n\n\n');

        await new Promise((resolve, reject) => {
            shell.on('close', (code, signal) => {
                clearTimeout(inactivityTimer);
                if (stderr) {
                    reject(new Error(stderr));
                } else {
                    resolve();
                }
            });

            shell.on('end', () => {
                resolve();
            });
        });

        const rpcReply = data.match(/<rpc-reply[\s\S]*?<\/rpc-reply>/);

        if (rpcReply) {
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(rpcReply[0]);

            const commitResults = result['rpc-reply']['commit-results'];
            if (commitResults) {
                const error = commitResults[0]['xnm:error'];
                if (error) {
                    const errorMessage = error[0].message[0].trim();
                    throw {
                        status: 'commit_failed',
                        message: 'Commit error',
                        data: errorMessage,
                    };
                }
            }

            if (rpcReply[0].includes('<commit-success/>')) {
                return {
                    status: 'success',
                    message: 'Configuration committed successfully',
                    data: rpcReply[0],
                };
            } else {
                throw {
                    status: 'commit_failed',
                    message: 'Commit did not return success',
                    data: rpcReply[0],
                };
            }
        } else {
            throw {
                status: 'no_rpc_reply',
                message: 'No RPC reply found in the response',
                data: data,
            };
        }
    } catch (error) {
        let message = 'Unable to connect to host';
        let status = 'unreachable';
        if (error.message.includes('All configured authentication methods failed')) {
            message = 'Authentication failed. Check your username and password.';
            status = 'auth_failed';
        } else if (error.message.includes('Timed out while waiting for handshake')) {
            message = 'Connection timed out';
            status = 'timeout';
        }
        if (error.message === 'Session closed due to inactivity') {
            status = 'inactivity_timeout';
            message = 'Session closed due to inactivity';
        } else if (error.status) {
            throw error; // Re-throw custom errors
        }
        throw { status, message };
    } finally {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        ssh.dispose();
    }
};
