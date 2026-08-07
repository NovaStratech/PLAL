import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { NetworkService } from '../network/network.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let network: NetworkService;

  const mockNetwork = {
    findReachableUsers: jest.fn(),
    getDirectFriendIds: jest.fn(),
  };

  const mockPrisma = {
    recommendation: {
      findMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: NetworkService,
          useValue: mockNetwork,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    network = module.get<NetworkService>(NetworkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should filter recommendations by category', async () => {
      mockNetwork.findReachableUsers.mockResolvedValueOnce([
        { userId: 'user-1', depth: 1 },
        { userId: 'user-2', depth: 2 },
      ]);

      mockPrisma.recommendation.findMany.mockResolvedValueOnce([]);

      await service.search('searcher', { categoryId: 'cat-1', maxDepth: 2 });

      expect(mockPrisma.recommendation.findMany).toHaveBeenCalled();
    });

    it('should respect maxDepth limit', async () => {
      mockNetwork.findReachableUsers.mockResolvedValueOnce([
        { userId: 'user-1', depth: 1 },
      ]);

      mockPrisma.recommendation.findMany.mockResolvedValueOnce([]);

      await service.search('searcher', { maxDepth: 1 });

      expect(mockNetwork.findReachableUsers).toHaveBeenCalledWith('searcher', 1);
    });
  });
});
