import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreatePlayerStatsDto {
  @IsNotEmpty()
  @IsNumber()
  player_id: number;

  @IsNotEmpty()
  @IsNumber()
  match_id: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  minutes_played?: number;

  @IsOptional()
  @IsBoolean()
  starting_xi?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  goals?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  assists?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shots?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shots_on_target?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passes_completed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pass_accuracy?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  key_passes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  long_balls?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  crosses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tackles?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interceptions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  blocks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  clearances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duels_won?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dribbles_successful?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fouls_committed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fouls_suffered?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yellow_cards?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  red_cards?: number;

  @IsOptional()
  @IsString()
  highlights_video_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saves?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gk_runs_out?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  successful_punches?: number;
}
