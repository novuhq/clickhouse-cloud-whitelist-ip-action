"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
async function getCurrentIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) {
            throw new Error(`Failed to fetch IP: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        return data.ip;
    }
    catch (error) {
        core.error('Error fetching current IP address');
        throw error;
    }
}
async function addIpToAllowlist(orgId, serviceId, apiKeyId, apiKeySecret, ipAddress) {
    const url = `https://api.clickhouse.cloud/v1/organizations/${orgId}/services/${serviceId}`;
    const timestamp = new Date().toISOString();
    const source = `${ipAddress}/32`;
    const payload = {
        ipAccessList: {
            add: [
                {
                    source,
                    description: `GitHub Actions Runner - Added at ${timestamp}`
                }
            ]
        }
    };
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Basic ${Buffer.from(`${apiKeyId}:${apiKeySecret}`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add IP to allowlist: ${response.status} ${response.statusText}\n${errorText}`);
        }
        core.info(`✅ Successfully added IP ${source} to ClickHouse Cloud allowlist`);
    }
    catch (error) {
        core.error('Error adding IP to allowlist');
        throw error;
    }
}
async function run() {
    try {
        // Get inputs
        const orgId = core.getInput('clickhouse-org-id', { required: true });
        const serviceId = core.getInput('clickhouse-service-id', {
            required: true
        });
        const apiKeyId = core.getInput('clickhouse-api-key-id', { required: true });
        const apiKeySecret = core.getInput('clickhouse-api-key-secret', {
            required: true
        });
        // Get current IP
        core.info('🔍 Fetching current runner IP address...');
        const ipAddress = await getCurrentIpAddress();
        core.info(`📍 Current IP: ${ipAddress}`);
        // Add IP to allowlist
        core.info(`➕ Adding IP ${ipAddress}/32 to ClickHouse Cloud allowlist...`);
        await addIpToAllowlist(orgId, serviceId, apiKeyId, apiKeySecret, ipAddress);
        // Save IP to state for cleanup
        core.saveState('runner-ip', ipAddress);
        core.saveState('clickhouse-org-id', orgId);
        core.saveState('clickhouse-service-id', serviceId);
        core.saveState('clickhouse-api-key-id', apiKeyId);
        core.saveState('clickhouse-api-key-secret', apiKeySecret);
        // Set output
        core.setOutput('runner-ip', ipAddress);
        core.info('✨ IP allowlist operation completed successfully');
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(`Action failed: ${error.message}`);
        }
        else {
            core.setFailed('Action failed with unknown error');
        }
    }
}
run();
//# sourceMappingURL=main.js.map