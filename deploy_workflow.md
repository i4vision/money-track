---
description: How to containerize and deploy this application using Portainer.
---

# Deploying the Application via Docker & Portainer

## 1. Prerequisites
You will need to install Docker Desktop on your machine.
- Download it here: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Make sure Docker is running before you proceed.

## 2. Setting up Portainer (Optional but recommended for UI Management)
If you don't already have Portainer running, you can start a Portainer container to manage your Docker environment through a web UI.

Open a PowerShell or Terminal and run the following commands:

```bash
docker volume create portainer_data
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```

You can then access Portainer at `https://localhost:9443` (accept the self-signed certificate warning the first time).

## 3. Deploying the MoneyTrack Application
We provide a `docker-compose.yml` file designed perfectly for Portainer stacks. It will spin up exactly one container that serves both the frontend application and the backend SQLite database seamlessly.

### Option A: Using the Command Line (Easiest)
Navigate to your project directory in terminal:
```bash
cd c:/Users/ia_agustin/.gemini/antigravity/scratch/money-track
docker-compose up -d --build
```
This will build the image, start the container, and mount a volume so your `database.sqlite` is saved safely even if the container is destroyed!

### Option B: Using Portainer Web UI
1. Open Portainer (`https://localhost:9443`)
2. Go into your Local Environment.
3. Click "Stacks" on the left sidebar, and click "Add Stack".
4. Give it a name (e.g., `moneytrack`).
5. Choose "Web editor" and simply paste the contents of our `docker-compose.yml` file into the editor.
6. Click "Deploy the stack".

*Note: For Portainer to build from source, you may need to use the "Repository" method instead, or build the image manually first. Option A is highly recommended.*

## 4. Accessing the Application
Once the container is running, the app will be available at:
`http://localhost:8080`
