#!/bin/bash
# =============================================================================
# CGP Immo Analytics — Setup VPS Ubuntu (OVH)
# À exécuter en root sur un VPS vierge Ubuntu 22.04/24.04
# Usage: chmod +x setup-vps.sh && sudo ./setup-vps.sh
# =============================================================================

set -e

echo "=========================================="
echo "  CGP Immo Analytics — Setup VPS"
echo "=========================================="

# --- 1. Mise à jour système ---
echo "[1/7] Mise à jour du système..."
apt update && apt upgrade -y

# --- 2. Installation des dépendances de base ---
echo "[2/7] Installation des outils de base..."
apt install -y \
    curl \
    wget \
    git \
    htop \
    unzip \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban

# --- 3. Installation Docker ---
echo "[3/7] Installation de Docker..."
# Supprimer anciennes versions si présentes
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Ajouter le repo Docker officiel
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ajouter l'utilisateur courant au groupe docker
ACTUAL_USER=${SUDO_USER:-$USER}
usermod -aG docker $ACTUAL_USER

# --- 4. Vérification Docker ---
echo "[4/7] Vérification Docker..."
docker --version
docker compose version

# --- 5. Configuration Firewall (UFW) ---
echo "[5/7] Configuration du firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# --- 6. Configuration Swap (utile pour les VPS avec RAM limitée) ---
echo "[6/7] Configuration du swap (4 Go)..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Optimiser swappiness pour un serveur
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    sysctl -p
fi

# --- 7. Configuration Fail2Ban ---
echo "[7/7] Configuration Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban

# --- Résumé ---
echo ""
echo "=========================================="
echo "  ✅ Setup terminé !"
echo "=========================================="
echo ""
echo "  Docker:     $(docker --version)"
echo "  Compose:    $(docker compose version)"
echo "  Firewall:   UFW actif (22, 80, 443)"
echo "  Swap:       4 Go configuré"
echo "  Fail2Ban:   Actif"
echo ""
echo "  ⚠️  IMPORTANT: Déconnecte-toi et reconnecte-toi"
echo "  pour que le groupe 'docker' soit pris en compte."
echo ""
echo "  Prochaine étape :"
echo "  cd /opt && git clone <ton-repo> cgp-immo-analytics"
echo "  cd cgp-immo-analytics && docker compose up -d"
echo "=========================================="
