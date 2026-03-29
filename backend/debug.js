const { Test } = require('@nestjs/testing');
const { AppModule } = require('./src/app.module');

async function debug() {
  try {
    console.log('Attempting to compile AppModule...');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    console.log('AppModule compiled successfully!');
  } catch (err) {
    console.error('FAILED TO COMPILE APPMODULE:');
    console.error(err);
  }
}

debug();
