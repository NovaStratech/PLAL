import { Test, TestingModule } from '@nestjs/testing';
import { NetworkService } from './network.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NetworkService', () => {
  let service: NetworkService;
  let prisma: PrismaService;

  const mockPrisma = {
    friendship: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NetworkService>(NetworkService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDirectFriendIds', () => {
    it('should return empty array for user with no friends', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([]);

      const result = await service.getDirectFriendIds('user-123');
      expect(result).toEqual([]);
    });

    it('should return friend IDs regardless of friendship direction', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([
        { requesterId: 'user-123', receiverId: 'friend-1' },
        { requesterId: 'friend-2', receiverId: 'user-123' },
      ]);

      const result = await service.getDirectFriendIds('user-123');
      expect(result.sort()).toEqual(['friend-1', 'friend-2']);
    });
  });

  describe('findShortestPath', () => {
    it('should return null for unreachable user', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([]);

      const result = await service.findShortestPath('user-a', 'user-z', 3);
      expect(result).toBeNull();
    });

    it('should return empty path for same user', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([]);

      const result = await service.findShortestPath('user-a', 'user-a', 3);
      expect(result?.userIds).toEqual(['user-a']);
    });
  });
});
