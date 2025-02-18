// import { MCServerApi, ServerStatus } from '../MCServerService';
// import { fetcher } from '~/utils';

// // Mock the entire utils module
// jest.mock('~/utils', () => ({
//   fetcher: jest.fn(() => {})
// }));

// describe('MCServerStatusCache', () => {
//   // Reset mocks before each test
//   beforeEach(() => {
//     jest.clearAllMocks();

//     // @ts-ignore - accessing private method for testing
//     MCServerApi.getStatus['instance'] = null;
//   });

//   // Helper to simulate passage of time
//   const advanceTime = (ms: number) => {
//     jest.useFakeTimers();
//     jest.advanceTimersByTime(ms);
//   };

//   it('should create a singleton instance', async () => {
//     const status1 = await MCServerApi.getStatus();
//     const status2 = await MCServerApi.getStatus();

//     // Verify fetcher was called only once
//     expect(fetcher).toHaveBeenCalledTimes(1);

//     // Ensure both calls return the same status
//     expect(status1).toEqual(status2);
//   });

//   it('should fetch status synchronously on first call', async () => {
//     // Mock a specific server status
//     (fetcher as jest.Mock).mockResolvedValue({ status: ServerStatus.Running });

//     const status = await MCServerApi.getStatus();

//     expect(fetcher).toHaveBeenCalledTimes(1);
//     expect(status).toBe(ServerStatus.Running);
//   });

//   it('should return cached status within cache expiry time', async () => {
//     // Mock initial and subsequent statuses
//     (fetcher as jest.Mock)
//       .mockResolvedValueOnce({ status: ServerStatus.Running })
//       .mockResolvedValueOnce({ status: ServerStatus.Stopped });

//     // First call to populate cache
//     const initialStatus = await MCServerApi.getStatus();
//     expect(initialStatus).toBe(ServerStatus.Running);

//     // Advance time less than cache expiry
//     advanceTime(30000); // 30 seconds (half of 1 minute expiry)

//     // Second call should return cached status
//     const cachedStatus = await MCServerApi.getStatus();
//     expect(cachedStatus).toBe(ServerStatus.Running);

//     // Verify fetcher was called only once
//     expect(fetcher).toHaveBeenCalledTimes(1);
//   });

//   it('should refresh status in background after cache expiry', async () => {
//     jest.useFakeTimers();

//     // Mock initial and refresh statuses
//     (fetcher as jest.Mock)
//       .mockResolvedValueOnce({ status: ServerStatus.Running })
//       .mockResolvedValueOnce({ status: ServerStatus.Stopped });

//     // First call to populate cache
//     const initialStatus = await MCServerApi.getStatus();
//     expect(initialStatus).toBe(ServerStatus.Running);

//     // Advance time past cache expiry
//     advanceTime(70000); // 70 seconds (past 1 minute expiry)

//     // Next call should trigger background refresh
//     const refreshedStatus = await MCServerApi.getStatus();

//     // Run all pending timers to allow background refresh
//     jest.runAllTimers();

//     // Verify fetcher was called twice (initial + background refresh)
//     expect(fetcher).toHaveBeenCalledTimes(2);
//   });

//   it('should handle background refresh errors gracefully', async () => {
//     // Mock initial success, then background refresh error
//     (fetcher as jest.Mock)
//       .mockResolvedValueOnce({ status: ServerStatus.Running })
//       .mockRejectedValueOnce(new Error('Network error'));

//     // Spy on console.error to verify error logging
//     const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() =>{});

//     // First call to populate cache
//     const initialStatus = await MCServerApi.getStatus();
//     expect(initialStatus).toBe(ServerStatus.Running);

//     // Advance time past cache expiry
//     advanceTime(70000);

//     // Trigger background refresh
//     await MCServerApi.getStatus();

//     // Verify error was logged
//     expect(consoleSpy).toHaveBeenCalledWith(
//       'Background status refresh failed:',
//       expect.any(Error)
//     );

//     consoleSpy.mockRestore();
//   });
// });
