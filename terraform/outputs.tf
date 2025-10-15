output "resource_group_name" {
  description = "Resource Group created for the Canner app"
  value       = azurerm_resource_group.canner.name
}

output "acr_login_server" {
  description = "Login server of the Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "backend_app_url" {
  description = "URL of the deployed backend application"
  value       = azurerm_app_service.backend.default_site_hostname
}
