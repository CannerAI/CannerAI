
# ☁️ Deploy Canner on Microsoft Azure using Terraform

This guide explains how to deploy the **Canner open-source project** infrastructure on **Microsoft Azure** using **Terraform**.

The Terraform configuration provisions the following resources:

- **Azure Resource Group**
- **Azure Container Registry (ACR)** – to store Docker images
- **Azure App Service Plan**
- **Azure App Service** – to host the backend containerized application

---

## 📂 Folder Structure

```

canner-main/
└── terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
├── providers.tf
└── README.md

````

Each file serves a specific purpose:

| File | Description |
|------|--------------|
| `main.tf` | Defines the Azure resources to be created. |
| `variables.tf` | Declares input variables used across Terraform configurations. |
| `outputs.tf` | Displays key outputs after Terraform execution (e.g., URLs, ACR name). |
| `terraform.tfvars` | Stores the actual values for the defined variables. |
| `providers.tf` | Configures the Azure provider and Terraform backend. |
| `README.md` | This guide file with all setup steps. |

---

## 📋 Prerequisites

Before starting, make sure you have:

- An active **Azure Subscription**
- [Terraform](https://developer.hashicorp.com/terraform/downloads) **v1.5+**
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Git** installed on your local machine

---

## 🚀 Step 1: Clone the Repository

Clone the open-source Canner project:

```bash
git clone https://github.com/piyushsachdeva/canner.git
cd canner/terraform
````

---

## 🔐 Step 2: Login to Azure

Use the Azure CLI to authenticate your account:

```bash
az login
```

If you have multiple subscriptions, set the active one:

```bash
az account set --subscription "<Your-Subscription-ID>"
```

---

## ⚙️ Step 3: Initialize Terraform

Initialize the Terraform working directory to download required providers and modules:

```bash
terraform init
```

---

## 🧾 Step 4: Review the Terraform Plan

Before applying changes, review what will be created:

```bash
terraform plan
```

This command shows a preview of the infrastructure resources Terraform will create in Azure.

---

## 🏗️ Step 5: Apply Terraform Configuration

Deploy the infrastructure to Azure:

```bash
terraform apply
```

When prompted, type **yes** to confirm.

After successful deployment, you’ll see outputs similar to:

```
Outputs:

acr_login_server = "cannerdemoacr.azurecr.io"
backend_app_url  = "canner-backend.azurewebsites.net"
resource_group_name = "rg-canner"
```

---

## 🌐 Step 6: Access the Backend Application

Once deployed, open your browser and visit:

```
https://canner-backend.azurewebsites.net/api/health
```

If the app returns a healthy response, your backend is successfully deployed.

If you see an **Application Error**, continue to the next step to build and push the Docker image.

---

## 🐳 Step 7: Build and Push Docker Image to Azure Container Registry (ACR)

Login to your Azure Container Registry (ACR):

```bash
az acr login --name cannerdemoacr
```

Build the Docker image and tag it for your ACR:

```bash
docker build -t cannerdemoacr.azurecr.io/backend:latest ./backend
```

Push the image to ACR:

```bash
docker push cannerdemoacr.azurecr.io/backend:latest
```

---

## 🔄 Step 8: Restart the Azure App Service

Restart the App Service to pull the latest Docker image:

```bash
az webapp restart --name canner-backend --resource-group rg-canner
```

Now verify again:

```
https://canner-backend.azurewebsites.net/api/health
```

If you get a success message (e.g., `"Healthy"` or HTTP 200), the deployment is complete.

---

## 🧹 Step 9: Clean Up Resources

To avoid incurring charges, destroy all Azure resources created by Terraform:

```bash
terraform destroy
```

Confirm with **yes** when prompted.

---

### Thank You