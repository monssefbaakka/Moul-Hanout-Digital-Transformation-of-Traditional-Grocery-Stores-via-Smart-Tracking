import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';

describe('Smoke', () => {
  it('should load AppModule', async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleFixture).toBeDefined();
  });
});
