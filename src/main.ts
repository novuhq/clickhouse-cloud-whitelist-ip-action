import * as core from '@actions/core'

interface IpifyResponse {
  ip: string
}

async function getCurrentIpAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    if (!response.ok) {
      throw new Error(
        `Failed to fetch IP: ${response.status} ${response.statusText}`
      )
    }

    const data = (await response.json()) as IpifyResponse
    return data.ip
  } catch (error) {
    core.error('Error fetching current IP address')
    throw error
  }
}

async function addIpToAllowlist(
  orgId: string,
  serviceId: string,
  apiKeyId: string,
  apiKeySecret: string,
  ipAddress: string
): Promise<void> {
  const url = `https://api.clickhouse.cloud/v1/organizations/${orgId}/services/${serviceId}`
  const timestamp = new Date().toISOString()
  const source = `${ipAddress}/32`

  const payload = {
    ipAccessList: {
      add: [
        {
          source,
          description: `GitHub Actions Runner - Added at ${timestamp}`
        }
      ]
    }
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKeyId}:${apiKeySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to add IP to allowlist: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    core.info(
      `✅ Successfully added IP ${source} to ClickHouse Cloud allowlist`
    )
  } catch (error) {
    core.error('Error adding IP to allowlist')
    throw error
  }
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const orgId = core.getInput('clickhouse-org-id', { required: true })
    const serviceId = core.getInput('clickhouse-service-id', {
      required: true
    })
    const apiKeyId = core.getInput('clickhouse-api-key-id', { required: true })
    const apiKeySecret = core.getInput('clickhouse-api-key-secret', {
      required: true
    })

    // Get current IP
    core.info('🔍 Fetching current runner IP address...')
    const ipAddress = await getCurrentIpAddress()
    core.info(`📍 Current IP: ${ipAddress}`)

    // Add IP to allowlist
    core.info(`➕ Adding IP ${ipAddress}/32 to ClickHouse Cloud allowlist...`)
    await addIpToAllowlist(orgId, serviceId, apiKeyId, apiKeySecret, ipAddress)

    // Save IP to state for cleanup
    core.saveState('runner-ip', ipAddress)
    core.saveState('clickhouse-org-id', orgId)
    core.saveState('clickhouse-service-id', serviceId)
    core.saveState('clickhouse-api-key-id', apiKeyId)
    core.saveState('clickhouse-api-key-secret', apiKeySecret)

    // Set output
    core.setOutput('runner-ip', ipAddress)

    core.info('✨ IP allowlist operation completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`)
    } else {
      core.setFailed('Action failed with unknown error')
    }
  }
}

run()
