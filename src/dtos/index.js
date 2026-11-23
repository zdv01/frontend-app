// Export request and response DTOs from this module.

export function unwrapApiData(responseData) {
  return responseData?.data ?? responseData
}
