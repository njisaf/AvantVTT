# Deployment Scripts

This directory contains scripts for deploying the Avant VTT system to development environments.

## Build and Deploy Script

The `build-and-deploy.sh` script provides a one-command solution for building the Avant system and deploying it to a FoundryVTT v13 Docker container.

### Usage

#### Via NPM Script (Recommended)
```bash
# From the avantVtt project root
npm run deploy
```

#### Direct Script Execution
```bash
# From the avantVtt project root
./scripts/deployment/build-and-deploy.sh
```

### What It Does

1. **🏗️ Builds** the complete system with `npm run build`
2. **📦 Copies** all built files to the Docker container
3. **🔄 Restarts** the container for a clean deployment
4. **✅ Verifies** everything is working
5. **📋 Shows** deployment summary and next steps

### Requirements

- Docker with `foundry-vtt-v13` container
- Node.js and npm
- Bash shell

### Output

The script provides color-coded output with progress indicators:
- 🔵 Info messages
- 🟢 Success messages
- 🟡 Warning messages
- 🔴 Error messages

### Troubleshooting

If you encounter issues:

1. **Container not found**: Ensure your Docker container is named `foundry-vtt-v13`
2. **Permission denied**: Make sure the script is executable: `chmod +x scripts/deployment/build-and-deploy.sh`
3. **Build failures**: Check the build logs for specific error messages
4. **Container locked**: Stop the container first: `docker stop foundry-vtt-v13`

### Configuration

The script uses these default settings:
- **Container name**: `foundry-vtt-v13`
- **Container path**: `/data/Data/systems/avant`
- **Access URL**: `http://localhost:30000`

To change these settings, edit the variables at the top of the script.

### Integration

This script is designed to be part of the development workflow:
1. Make changes to the system
2. Run `npm run deploy`
3. Test at `http://localhost:30000`
4. Commit changes if everything works

The script automatically handles the build process, so you don't need to run `npm run build` separately. 