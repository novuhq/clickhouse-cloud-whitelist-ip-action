# ClickHouse Cloud IP Whitelist Action

A GitHub Action that automatically whitelists your GitHub Actions runner IP address in ClickHouse Cloud, with automatic cleanup after your job completes.

## Features

- 🔐 **Automatic IP Whitelisting**: Adds the current runner's IP to your ClickHouse Cloud service allowlist
- 🧹 **Automatic Cleanup**: Removes the IP from the allowlist when the job completes (even if it fails)
- 🚀 **Zero Configuration**: Just provide your ClickHouse credentials
- ✅ **Secure**: Uses ClickHouse Cloud API with proper authentication

## Usage

### Prerequisites

You'll need the following from ClickHouse Cloud:
- Organization ID
- Service ID
- API Key ID
- API Key Secret

### Basic Example

```yaml
name: ClickHouse Migration

on: [push]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Whitelist Runner IP
        uses: novuhq/clickhouse-cloud-whitelist-ip@v1
        with:
          clickhouse-org-id: ${{ secrets.CLICKHOUSE_ORG_ID }}
          clickhouse-service-id: ${{ secrets.CLICKHOUSE_SERVICE_ID }}
          clickhouse-api-key-id: ${{ secrets.CLICKHOUSE_API_KEY_ID }}
          clickhouse-api-key-secret: ${{ secrets.CLICKHOUSE_API_KEY_SECRET }}

      - name: Run Database Operations
        run: |
          # Your ClickHouse operations here
          # The runner IP is now whitelisted!
          
      # IP is automatically removed from allowlist after job completes
```

### Using the Output

The action outputs the whitelisted IP address:

```yaml
- name: Whitelist Runner IP
  id: whitelist
  uses: novuhq/clickhouse-cloud-whitelist-ip@v1
  with:
    clickhouse-org-id: ${{ secrets.CLICKHOUSE_ORG_ID }}
    clickhouse-service-id: ${{ secrets.CLICKHOUSE_SERVICE_ID }}
    clickhouse-api-key-id: ${{ secrets.CLICKHOUSE_API_KEY_ID }}
    clickhouse-api-key-secret: ${{ secrets.CLICKHOUSE_API_KEY_SECRET }}

- name: Show IP
  run: echo "Runner IP is ${{ steps.whitelist.outputs.runner-ip }}"
```

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `clickhouse-org-id` | ClickHouse Cloud Organization ID | Yes |
| `clickhouse-service-id` | ClickHouse Cloud Service ID | Yes |
| `clickhouse-api-key-id` | ClickHouse Cloud API Key ID | Yes |
| `clickhouse-api-key-secret` | ClickHouse Cloud API Key Secret | Yes |

## Outputs

| Output | Description |
|--------|-------------|
| `runner-ip` | The IP address of the GitHub Actions runner that was whitelisted |

## How It Works

1. **Main Step**: 
   - Fetches the current runner's public IP address using ipify.org
   - Adds the IP (as a /32 CIDR) to your ClickHouse Cloud service's IP allowlist
   - Saves the IP and credentials to action state
   - Outputs the IP address

2. **Cleanup Step** (runs automatically at job end):
   - Retrieves the IP from action state
   - Removes the IP from the allowlist
   - Runs even if the job fails (using `post-if: always()`)

## Security Best Practices

1. **Store credentials as GitHub Secrets**: Never hardcode your ClickHouse credentials in workflows
2. **Use environment-specific secrets**: Create separate API keys for different environments
3. **Limit API key permissions**: Use the minimum required permissions for your API keys
4. **Monitor access logs**: Regularly check your ClickHouse Cloud access logs

## Troubleshooting

### IP not whitelisted

If you see connection errors:
1. Check that all four credentials are correct
2. Verify your service ID is correct
3. Ensure your API key has permissions to modify IP allowlists

### Cleanup not running

The cleanup step runs automatically using GitHub Actions' `post` lifecycle. It will:
- Run even if previous steps fail
- Only log warnings if cleanup fails (won't fail the job)

## Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Bundle for distribution
npm run bundle

# Run all checks (format, lint, test, bundle)
npm run all
```

### Testing Locally

You can test the action locally using the `@github/local-action` utility:

```bash
# Create a .env file with your credentials (see .env.example)
# Then run:
npx @github/local-action . src/main.ts .env
```

### Project Structure

```
.
├── src/
│   ├── main.ts      # Main action (adds IP to allowlist)
│   └── cleanup.ts   # Cleanup action (removes IP from allowlist)
├── dist/            # Compiled JavaScript (committed to repo)
├── action.yml       # Action metadata
├── package.json     # Dependencies and scripts
└── tsconfig.json    # TypeScript configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with [actions/toolkit](https://github.com/actions/toolkit)
- IP detection via [ipify.org](https://www.ipify.org/)
- Template from [actions/typescript-action](https://github.com/actions/typescript-action)

