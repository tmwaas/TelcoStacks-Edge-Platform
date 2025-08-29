TelcoStacks Edge Platform – Cloud-Native Edge Pipeline 

Overview
TelcoStacks Edge Platform is a cloud‑native, Kubernetes‑based *edge pipeline* designed for telco/cloud scenarios. It simulates a data flow (ingest → transform → API) and includes CI/CD, observability, security policies, edge provisioning, and on‑call drills.

This repository contains application services (ingest, transform, api), deployment manifests (Kustomize overlays), observability configs (Prometheus/Grafana/Alertmanager), and security policies (OPA Gatekeeper).

Features
• Ingest Service – Accepts/generates events (simulated CDR/device usage) and forwards to transform.  
• Transform Service – Normalizes/enriches events and forwards summaries to API.  
• API Service – Exposes /stats and Prometheus /metrics for dashboards and alerts.  
• CI/CD Ready – GitLab CI and optional GitHub Actions for build → scan → deploy.  
• Kubernetes Deployment – Kustomize overlays for dev (k3d) and edge (k3s) targets.  
• Observability – Prometheus metrics, Grafana dashboards, Alertmanager (Slack/Email).  
• Security & Compliance – OPA Gatekeeper (no :latest, non‑root, resource limits), image scanning (Trivy).  
• Edge Provisioning – Ansible playbook to provision a k3s edge node (Ubuntu).

Architecture
                          ┌───────────────────────────┐
                          │        Dev & CI/CD        │
                          │  build • scan • deploy    │
                          └─────────────┬─────────────┘
                                        │
                                ┌───────▼───────┐
                                │ Kubernetes     │  (dev: k3d • edge: k3s)
                                │  (Namespace: telco)
                                └───┬─────┬─────┘
                                    │     │
         ┌──────────────────────────┘     └──────────────────────────┐
         │                                                          │
 ┌───────▼───────┐     HTTP POST      ┌──────────────┐     HTTP POST     ┌───────────┐
 │   ingest      │  ───────────────▶  │  transform   │  ───────────────▶ │   api     │
 │ (/ingest)     │                     │ (/process)   │                   │ (/stats)  │
 │ (/metrics)    │                     │ (/metrics)   │                   │ (/metrics)│
 └───────────────┘                     └──────────────┘                   └───────────┘
              \_____________________________  metrics  _____________________________/
                                               │
                                               ▼
                                   ┌──────────────────────┐
                                   │   Prometheus (SM)    │  ──alerts──▶ Alertmanager → Slack/Email
                                   └─────────┬────────────┘
                                             │
                                             ▼
                                         Grafana (Dashboards)

Repository Structure
telcostacks-edge-gateway/
├── apps/                          # Application microservices
│   ├── ingest/                    # Receives/generates events → forward to transform
│   ├── transform/                 # Normalizes/enriches events → forward to API
│   └── api/                       # Exposes stats + /metrics
├── deploy/
│   ├── k8s/
│   │   ├── base/                  # Namespace, Deployments, Services, HPA, PDB, NetPol
│   │   └── overlays/
│   │       ├── dev/               # Ingress (api.localtest.me), image tags for dev
│   │       └── edge/              # Node selectors/tolerations for edge nodes
│   └── ansible/                   # k3s provisioning playbook + inventories
├── observability/
│   ├── grafana/                   # Dashboards (JSON) + ConfigMap
│   └── prometheus/                # Alert rules + ServiceMonitors + Helm values
├── security/
│   └── opa/                       # Gatekeeper templates & constraints (policies)
├── ci/
│   └── k6/                        # Load test scripts
├── scripts/
│   └── dev_bootstrap.sh           # One‑liner: cluster + ingress + app + monitoring + policies
├── .gitlab-ci.yml                 # GitLab CI pipeline
├── .github/workflows/ci.yml       # (Optional) GitHub Actions pipeline
├── README.md                      # Project documentation (this file)

Getting Started
1) Clone the repository (or unzip the provided archive)
git clone https://github.com/<your-username>/telcostacks-edge-gateway.git
cd telcostacks-edge-gateway

2) Local Development (Docker Compose, quickest path)
docker compose -f docker-compose.dev.yml up --build
# test flow:
curl -X POST http://localhost:8081/generate?count=25
curl http://localhost:8083/stats

3) Kubernetes (dev) – k3d bootstrap (recommended)
# prerequisites: Docker, kubectl, helm, k3d
bash scripts/dev_bootstrap.sh
# verify & test
kubectl -n telco get pods
curl http://api.localtest.me/stats

4) Edge Deployment (k3s on Ubuntu)
# provision k3s single-node (see deploy/ansible)
ansible-playbook -i deploy/ansible/inventories/edge/hosts.ini deploy/ansible/playbooks/provision.yml
# deploy workloads
kubectl apply -k deploy/k8s/overlays/edge

5) Access the Services
# API (via Ingress in dev):
http://api.localtest.me/stats
# Prometheus/Grafana/Alertmanager (installed via kube‑prometheus‑stack):
kubectl -n monitoring get pods
# (optional) port-forward Grafana:
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
open http://localhost:3000

Tech Stack
Cloud/Orchestration: Kubernetes (k3d/k3s), Helm, Kustomize  
IaC/Automation: Ansible (k3s provisioning)  
Containers: Docker  
Languages: Node.js (Express) for all services  
CI/CD: GitLab CI (.gitlab-ci.yml), GitHub Actions (optional)  
Observability: Prometheus, Grafana, Alertmanager, ServiceMonitors  
Security: OPA Gatekeeper (policies), Trivy image scanning  
Testing: k6 load testing

Security & Compliance
• Containers run as non‑root with resource limits and probes.  
• OPA Gatekeeper policies enforce “no :latest”, non‑root, and limits/requests.  
• NetworkPolicies restrict traffic within the namespace.  
• Image scanning with Trivy in CI.  

Contributing
Contributions are welcome! Fork the repo, create a feature branch, and open a Pull Request.  