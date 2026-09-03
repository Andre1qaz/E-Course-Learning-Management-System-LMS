import { ApiError, apiFetch } from './api'

// Mock fetch globally
global.fetch = jest.fn()

describe('API utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('apiFetch', () => {
    it('should successfully fetch data', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Test' },
        message: 'Success',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await apiFetch('/test')

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/proxy?endpoint=%2Ftest',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('should include authorization token when provided', async () => {
      const mockResponse = {
        success: true,
        data: null,
        message: 'Success',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      })

      await apiFetch('/test', {}, 'test-token')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/proxy?endpoint=%2Ftest',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      )
    })

    it('should throw ApiError for non-successful responses', async () => {
      const mockErrorResponse = {
        success: false,
        data: null,
        message: 'Error occurred',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockErrorResponse,
        text: async () => JSON.stringify(mockErrorResponse),
      })

      await expect(apiFetch('/test')).rejects.toThrow(ApiError)
      await expect(apiFetch('/test')).rejects.toThrow('Error occurred')
    })

    it('should throw ApiError for HTTP errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ success: false, message: 'Not Found' }),
        text: async () => JSON.stringify({ success: false, message: 'Not Found' }),
      })

      await expect(apiFetch('/test')).rejects.toThrow(ApiError)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'))

      await expect(apiFetch('/test')).rejects.toThrow(ApiError)
      await expect(apiFetch('/test')).rejects.toThrow('Network error')
    })

    it('should handle invalid JSON responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
        text: async () => 'invalid json',
      })

      await expect(apiFetch('/test')).rejects.toThrow(ApiError)
    })
  })

  describe('ApiError', () => {
    it('should create ApiError with message', () => {
      const error = new ApiError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('ApiError')
    })

    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 404)
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
    })
  })
})