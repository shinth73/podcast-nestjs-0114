import { Test } from '@nestjs/testing';
import { JwtService } from 'src/jwt/jwt.service';
import * as jwt from 'jsonwebtoken';

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token-baby'),
  verify: jest.fn(),
});

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: jwt,
          useValue: mockJwtService(),
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should be signed', async () => {
      const result = service.sign(1);
      expect(result).toEqual('signed-token-baby');
      //   expect(jwt.sign).toHaveBeenCalledTimes(1);
      //   expect(jwt.sign).toHaveBeenCalledWith(1);
    });
  });
});
// @Injectable()
// export class JwtService {
//   constructor(
//     @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
//   ) {}

//   sign(userId: number): string {
//     return jwt.sign({ id: userId }, this.options.privateKey);
//   }

//   verify(token: string) {
//     return jwt.verify(token, this.options.privateKey);
//   }
// }
