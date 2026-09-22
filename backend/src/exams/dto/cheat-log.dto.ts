import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

// Heuristic #5: Error Prevention — validate anti-cheat report data

export enum CheatEventType {
  TAB_SWITCH = 'TAB_SWITCH',
  WINDOW_BLUR = 'WINDOW_BLUR',
  COPY_ATTEMPT = 'COPY_ATTEMPT',
  CONTEXT_MENU = 'CONTEXT_MENU',
  FULLSCREEN_EXIT = 'FULLSCREEN_EXIT',
}

export class CheatLogDto {
  @IsEnum(CheatEventType)
  eventType: CheatEventType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  details?: string;
}
