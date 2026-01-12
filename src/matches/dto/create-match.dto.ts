import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMatchDto {
  @IsNotEmpty()
  @IsNumber()
  home_team_id: number;

  @IsNotEmpty()
  @IsNumber()
  away_team_id: number;

  @IsNotEmpty()
  @IsString()
  competition: string;

  @IsNotEmpty()
  @IsDateString()
  match_date: Date;

  @IsNotEmpty()
  @IsString()
  venue: string;

  @IsOptional()
  @IsNumber()
  home_score?: number;

  @IsOptional()
  @IsNumber()
  away_score?: number;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsOptional()
  @IsString()
  video_platform?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  created_by_id?: string;
}
