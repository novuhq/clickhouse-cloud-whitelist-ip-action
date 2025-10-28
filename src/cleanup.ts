import * as core from '@actions/core'

async function removeIpFromAllowlist(
  orgId: string,
  serviceId: string,
  apiKeyId: string,
  apiKeySecret: string,
  ipAddress: string
): Promise<void> {
  const url = `https://api.clickhouse.cloud/v1/organizations/${orgId}/services/${serviceId}`
  const source = `${ipAddress}/32`

  const payload = {
    ipAccessList: {
      remove: [
        {
          source,
          description: ''
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
        `Failed to remove IP from allowlist: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    core.info(
      `🗑️  Successfully removed IP ${source} from ClickHouse Cloud allowlist`
    )
  } catch (error) {
    core.error('Error removing IP from allowlist')
    throw error
  }
}

async function cleanup(): Promise<void> {
  try {
    // Retrieve saved state from main action
    const ipAddress = core.getState('runner-ip')
    const orgId = core.getState('clickhouse-org-id')
    const serviceId = core.getState('clickhouse-service-id')
    const apiKeyId = core.getState('clickhouse-api-key-id')
    const apiKeySecret = core.getState('clickhouse-api-key-secret')

    if (!ipAddress) {
      core.warning('No IP address found in state, skipping cleanup')
      return
    }

    if (!orgId || !serviceId || !apiKeyId || !apiKeySecret) {
      core.warning('Missing ClickHouse credentials in state, skipping cleanup')
      return
    }

    core.info('🧹 Running cleanup: removing IP from allowlist...')
    core.info(`📍 Removing IP: ${ipAddress}`)

    await removeIpFromAllowlist(
      orgId,
      serviceId,
      apiKeyId,
      apiKeySecret,
      ipAddress
    )

    core.info('✨ Cleanup completed successfully')
  } catch (error) {
    // Don't fail the job if cleanup fails
    if (error instanceof Error) {
      core.warning(`Cleanup failed: ${error.message}`)
    } else {
      core.warning('Cleanup failed with unknown error')
    }
  }
}

cleanup()
