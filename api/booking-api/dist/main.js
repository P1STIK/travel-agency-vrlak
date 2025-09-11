"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: false });
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const origins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) ?? [];
    if (origins.length) {
        app.enableCors({ origin: origins, credentials: true });
    }
    else {
        app.enableCors();
    }
    const port = process.env.PORT || 3333;
    await app.listen(port);
    console.log(`🚀 Booking API is running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map