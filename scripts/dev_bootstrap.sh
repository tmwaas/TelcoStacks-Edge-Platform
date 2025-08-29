#!/usr/bin/env bash
set -euo pipefail
CLUSTER=${CLUSTER:-telco-dev}
k3d cluster list | grep -q "$CLUSTER" || k3d cluster create "$CLUSTER" --servers 1 --agents 2
docker build -t local/ingest:dev apps/ingest
docker build -t local/transform:dev apps/transform
docker build -t local/api:dev apps/api
k3d image import -c "$CLUSTER" local/ingest:dev local/transform:dev local/api:dev
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx >/dev/null
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace >/dev/null
kubectl apply -k deploy/k8s/overlays/dev
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null
helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f observability/prometheus/kube-prom-stack-values.yaml >/dev/null
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts >/dev/null
helm upgrade --install gatekeeper gatekeeper/gatekeeper -n gatekeeper-system --create-namespace >/dev/null || true
kubectl apply -f security/opa/no-latest-template.yaml
kubectl apply -f security/opa/no-latest-constraint.yaml
kubectl apply -f security/opa/nonroot-template.yaml
kubectl apply -f security/opa/nonroot-constraint.yaml
kubectl apply -f observability/prometheus/servicemonitors.yaml
kubectl apply -f observability/grafana/configmap.yaml
echo "Done. Try: curl -X POST http://localhost:8081/generate?count=25 && curl http://api.localtest.me/stats"
