variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "Central India"
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "rg-canner"
}

variable "acr_name" {
  description = "Azure Container Registry name (must be globally unique)"
  type        = string
  default     = "cannerdemoacr"
}
