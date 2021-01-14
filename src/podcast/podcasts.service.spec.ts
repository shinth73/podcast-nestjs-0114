import { getRepositoryToken } from '@nestjs/typeorm';
import { Episode } from './entities/episode.entity';
import { Repository } from 'typeorm';
import { Podcast } from './entities/podcast.entity';
import { PodcastsService } from './podcasts.service';
import { Test } from '@nestjs/testing';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('PodcastService', () => {
  let service: PodcastsService;
  let podcastRepository: MockRepository<Podcast>;
  let episodeRepository: MockRepository<Episode>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PodcastsService,
        {
          provide: getRepositoryToken(Podcast),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Episode),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<PodcastsService>(PodcastsService);
    podcastRepository = module.get(getRepositoryToken(Podcast));
    episodeRepository = module.get(getRepositoryToken(Episode));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPodcasts', () => {
    it('should return PodcastS if exist', async () => {
      const mockedPodcasts = [
        {
          title: 'test',
          category: 'testcat',
          rating: 5,
        },
      ];
      podcastRepository.find.mockResolvedValue(mockedPodcasts);
      const result = await service.getAllPodcasts();
      expect(result).toEqual({ ok: true, podcasts: mockedPodcasts });
    });

    it('should fail on exception', async () => {
      podcastRepository.find.mockRejectedValue(new Error());
      const result = await service.getAllPodcasts();
      expect(result).toEqual({
        ok: false,
        error: 'Internal server error occurred.',
      });
    });
  });

  describe('createPodcast', () => {
    const createPodcastArg = {
      title: 'test',
      category: 'testcat',
    };
    it('should create a new podcast', async () => {
      podcastRepository.create.mockReturnValue(createPodcastArg);
      podcastRepository.save.mockResolvedValue(createPodcastArg);
      const result = await service.createPodcast(createPodcastArg);
      expect(podcastRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastRepository.create).toHaveBeenCalledWith(createPodcastArg);
      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(createPodcastArg);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      podcastRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createPodcast(createPodcastArg);
      expect(result).toEqual({
        ok: false,
        error: 'Internal server error occurred.',
      });
    });
  });

  describe('getPodcast', () => {
    const mockedPodcast = {
      id: 1,
      title: 'test',
      category: 'testcat',
      rating: 5,
    };

    it('should fail if not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.getPodcast(1);
      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: 'Podcast with id 1 not found',
      });
    });

    it('should return if exist', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.getPodcast(1);
      expect(result).toEqual({
        ok: true,
        podcast: mockedPodcast,
      });
    });

    it('should fail on exception', async () => {
      podcastRepository.findOne.mockRejectedValue(new Error());
      const result = await service.getPodcast(1);
      expect(result).toEqual({
        ok: false,
        error: 'Internal server error occurred.',
      });
    });
  });

  describe('deletePodcast', () => {
    const mockedPodcast = {
      id: 1,
      title: 'test',
      category: 'testcat',
      rating: 5,
    };

    it('should fail if not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.deletePodcast(1);
      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id 1 not found`,
      });
    });

    it('should be delete if exist', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.deletePodcast(1);
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail on exception', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      podcastRepository.delete.mockRejectedValue(new Error());
      const result = await service.deletePodcast(1);
      expect(result).toEqual({
        ok: false,
        error: 'Internal server error occurred.',
      });
    });
  });

  describe('updatePodcast', () => {
    const mockedPodcast = {
      id: 1,
      title: 'test',
      category: 'testcat',
      rating: 5,
    };
    const mockedPodcastArg = {
      id: 1,
      title: 'test2',
      category: 'testcat2',
      rating: 4,
    };
    const mockedErrorPodcastArg = {
      id: 1,
      title: 'test2',
      category: 'testcat2',
      rating: 6,
    };

    it('should fail if not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.updatePodcast({
        id: 1,
        payload: mockedPodcastArg,
      });
      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id 1 not found`,
      });
    });

    it('should fail if not rating range is over', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.updatePodcast({
        id: 1,
        payload: mockedErrorPodcastArg,
      });
      expect(result).toEqual({
        ok: false,
        error: `Rating must be between 1 and 5.`,
      });
    });

    it('should update Podcast', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.updatePodcast({
        id: 1,
        payload: mockedPodcastArg,
      });
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail on exception', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      podcastRepository.save.mockRejectedValue(new Error());
      const result = await service.updatePodcast({
        id: 1,
        payload: mockedPodcastArg,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Internal server error occurred.',
      });
    });
  });

  describe('getEpisodes', () => {
    const mockedEpisods = [
      {
        id: 1,
        title: 'epi_test',
        category: 'epi_test_cat',
      },
    ];
    const mockedPodcast = {
      id: 1,
      title: 'test',
      category: 'testcat',
      rating: 5,
      episodes: mockedEpisods,
    };

    it('should fail if podcast not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.getEpisodes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: 'Podcast with id 1 not found',
      });
    });
    it('should return episode', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.getEpisodes(1);
      expect(result).toEqual({
        ok: true,
        episodes: mockedEpisods,
      });
    });
  });

  describe('getEpisode', () => {
    const mockedEpisods = {
      id: 1,
      title: 'epi_test',
      category: 'epi_test_cat',
    };
    const mockedPodcast = {
      id: 1,
      title: 'test',
      category: 'testcat',
      rating: 5,
      episodes: [mockedEpisods],
    };

    it('should fail if podcast not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.getEpisode({ podcastId: 1, episodeId: 1 });
      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: 'Podcast with id 1 not found',
      });
    });

    it('should fail if episode not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.getEpisode({ podcastId: 1, episodeId: 2 });
      expect(result).toEqual({
        ok: false,
        error: `Episode with id 2 not found in podcast with id 1`,
      });
    });

    it('should fail if episode not exist', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.getEpisode({ podcastId: 1, episodeId: 2 });
      expect(result).toEqual({
        ok: false,
        error: `Episode with id 2 not found in podcast with id 1`,
      });
    });

    it('should get episode', async () => {
      podcastRepository.findOne.mockResolvedValue(mockedPodcast);
      const result = await service.getEpisode({ podcastId: 1, episodeId: 1 });
      expect(result).toEqual({
        ok: true,
        episode: mockedEpisods,
      });
    });

    describe('createEpisode', () => {
      const mockedEpisods = {
        podcastId: 1,
        title: 'epi_test',
        category: 'epi_test_cat',
      };
      const mockedInputEpisods = {
        id: 1,
        title: 'epi_test',
        category: 'epi_test_cat',
      };
      const mockedPodcast = {
        id: 1,
        title: 'test',
        category: 'testcat',
        rating: 5,
      };

      it('should fail if podcast not exist', async () => {
        podcastRepository.findOne.mockResolvedValue(null);
        const result = await service.createEpisode(mockedEpisods);
        expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
        expect(podcastRepository.findOne).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Object),
        );
        expect(result).toEqual({
          ok: false,
          error: 'Podcast with id 1 not found',
        });
      });

      it('should create episode', async () => {
        podcastRepository.findOne.mockResolvedValue(mockedPodcast);
        episodeRepository.create.mockResolvedValue(mockedInputEpisods);
        episodeRepository.save.mockResolvedValue(mockedInputEpisods);
        const result = await service.createEpisode(mockedEpisods);
        expect(result).toEqual({
          ok: true,
          id: 1,
        });
      });

      it('should fail on exception', async () => {
        podcastRepository.findOne.mockResolvedValue(mockedPodcast);
        episodeRepository.save.mockRejectedValue(new Error());
        const result = await service.createEpisode(mockedEpisods);
        expect(result).toEqual({
          ok: false,
          error: 'Internal server error occurred.',
        });
      });
    });

    describe('deleteEpisode', () => {
      const mockedEpisods = {
        id: 1,
        title: 'epi_test',
        category: 'epi_test_cat',
      };
      const mockedPodcast = {
        id: 1,
        title: 'test',
        category: 'testcat',
        rating: 5,
        episodes: [mockedEpisods],
      };

      it('should fail if podcast not exist', async () => {
        podcastRepository.findOne.mockResolvedValue(null);
        const result = await service.deleteEpisode({
          podcastId: 1,
          episodeId: 1,
        });
        expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
        expect(podcastRepository.findOne).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Object),
        );
        expect(result).toEqual({
          ok: false,
          error: 'Podcast with id 1 not found',
        });
      });

      it('should delete', async () => {
        podcastRepository.findOne.mockResolvedValue(mockedPodcast);
        const result = await service.deleteEpisode({
          podcastId: 1,
          episodeId: 1,
        });
        expect(result).toEqual({
          ok: true,
        });
      });

      it('should fail on exception', async () => {
        podcastRepository.findOne.mockResolvedValue(mockedPodcast);
        episodeRepository.delete.mockRejectedValue(new Error());
        const result = await service.deleteEpisode({
          podcastId: 1,
          episodeId: 1,
        });
        expect(result).toEqual({
          ok: false,
          error: 'Internal server error occurred.',
        });
      });
    });

    describe('updateEpisode', () => {
      const input = {
        podcastId: 1,
        episodeId: 1,
        title: 'epi_testnew',
        category: 'epi_test_catnew',
      };
      const mockedEpisods = {
        id: 1,
        title: 'epi_test',
        category: 'epi_test_cat',
      };
      const mockedPodcast = {
        id: 1,
        title: 'test',
        category: 'testcat',
        rating: 5,
        episodes: [mockedEpisods],
      };

      it('should fail if podcast not exist', async () => {
        podcastRepository.findOne.mockResolvedValue(null);
        const result = await service.updateEpisode(input);
        expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
        expect(podcastRepository.findOne).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Object),
        );
        expect(result).toEqual({
          ok: false,
          error: 'Podcast with id 1 not found',
        });
      });

      it('should update episode', async () => {
        podcastRepository.findOne.mockResolvedValue(mockedPodcast);
        const result = await service.updateEpisode(input);
        expect(result).toEqual({
          ok: true,
        });
      });

      it('should fail on exception', async () => {
        podcastRepository.findOne.mockResolvedValue(mockedPodcast);
        episodeRepository.save.mockRejectedValue(new Error());
        const result = await service.updateEpisode(input);
        expect(result).toEqual({
          ok: false,
          error: 'Internal server error occurred.',
        });
      });
    });
  });
});
