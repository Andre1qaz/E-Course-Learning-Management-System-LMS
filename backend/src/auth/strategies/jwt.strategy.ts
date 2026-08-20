import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new UnauthorizedException(
        'Token tidak valid. Silakan login kembali.',
      );
    }

    const select = { id: true, email: true, role: true, name: true } as const;

    let user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select,
    });

    // After migrate/reseed the JWT can still be valid but carry a stale user id.
    if (!user && payload.email) {
      user = await this.prisma.user.findUnique({
        where: { email: payload.email },
        select,
      });
    }

    if (!user) {
      throw new UnauthorizedException(
        'Sesi tidak valid. Silakan login kembali.',
      );
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }
}
