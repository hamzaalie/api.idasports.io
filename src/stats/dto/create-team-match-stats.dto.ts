import { IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateTeamMatchStatsDto {
  @IsNotEmpty()
  @IsNumber()
  match_id: number;

  @IsNotEmpty()
  @IsNumber()
  team_id: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  goals?: number;

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
  total_shots?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shots_on_target?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  possession_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passes_in_penalty_area?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tackles?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  blocks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  successful_dribbles?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duels_won?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  miscontrols?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fouled_when_dribble?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fouls?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yellow_cards?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  red_cards?: number;
}
