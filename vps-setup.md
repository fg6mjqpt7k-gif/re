# Configuration VPS OVH — 06/02/2026

## Infos serveur

- **VPS** : vps-eaed1e2f.vps.ovh.net
- **IPv4** : 51.255.192.220
- **IPv6** : 2001:41d0:305:2100::1:580
- **OS** : Debian 12
- **Utilisateur** : debian
- **Port SSH** : 22

## Accès

- **SSH** : `ssh debian@51.255.192.220`
- **n8n** : http://51.255.192.220:5678

## Étapes réalisées

### 1. Réinstallation OS
- Réinstallation complète en Debian 12 (image n8n) depuis le panel OVH
- Changement du mot de passe imposé par OVH à la première connexion

### 2. Configuration SSH
- Suppression ancienne empreinte : `ssh-keygen -R 51.255.192.220`
- Copie de la clé publique ED25519 : `ssh-copy-id debian@51.255.192.220`
- Désactivation de l'authentification par mot de passe
- Désactivation de la connexion root

### 3. Firewall (UFW)
- Ports ouverts : 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 4. Docker
- Installation de docker.io et docker-compose
- Ajout de l'utilisateur debian au groupe docker

### 5. n8n
- Image : `n8nio/n8n:1.76.1`
- Port : 5678
- Variable : `N8N_SECURE_COOKIE=false`
- Volume : `n8n_data:/home/node/.n8n`
- Commande : `docker run -d --restart always --name n8n -p 5678:5678 -e N8N_SECURE_COOKIE=false -v n8n_data:/home/node/.n8n n8nio/n8n:1.76.1`

## Prochaines étapes

- Ouvrir le port 5678 dans UFW : `sudo ufw allow 5678/tcp`
- Configurer un nom de domaine
- Mettre en place HTTPS avec Let's Encrypt (Nginx reverse proxy)
- Sécuriser n8n avec cookie HTTPS et retirer N8N_SECURE_COOKIE=false
