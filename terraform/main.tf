terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.110.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# -------------------------------
# Resource Group
# -------------------------------
resource "azurerm_resource_group" "canner" {
  name     = var.resource_group_name
  location = var.location
}

# -------------------------------
# Container Registry (ACR)
# -------------------------------
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.canner.name
  location            = azurerm_resource_group.canner.location
  sku                 = "Basic"
  admin_enabled       = true
}

# -------------------------------
# App Service Plan
# -------------------------------
resource "azurerm_app_service_plan" "plan" {
  name                = "canner-app-plan"
  location            = azurerm_resource_group.canner.location
  resource_group_name = azurerm_resource_group.canner.name

  sku {
    tier = "Basic"
    size = "B1"
  }

  kind = "Linux"
  reserved = true
}

# -------------------------------
# App Service (Backend)
# -------------------------------
resource "azurerm_app_service" "backend" {
  name                = "canner-backend"
  location            = azurerm_resource_group.canner.location
  resource_group_name = azurerm_resource_group.canner.name
  app_service_plan_id = azurerm_app_service_plan.plan.id

  site_config {
    linux_fx_version = "DOCKER|${azurerm_container_registry.acr.login_server}/backend:latest"
  }

  app_settings = {
    "WEBSITES_PORT"             = "5000"
    "DOCKER_REGISTRY_SERVER_URL" = "https://${azurerm_container_registry.acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME" = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD" = azurerm_container_registry.acr.admin_password
  }

  depends_on = [azurerm_container_registry.acr]
}
