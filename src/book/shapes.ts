import { Allow, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

const kinds = ["Conference", "State occasion", "Concert", "Exhibition", "Launch"];
const dayStatus = ["planning", "confirmed", "on-site", "delivered", "hold"];
const briefStatus = ["new", "review", "briefed", "closed"];
const runState = ["open", "done", "blocked"];

export class DayDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(kinds)
  kind!: string;

  @IsString()
  client!: string;

  @IsString()
  venue!: string;

  @IsString()
  @MinLength(8)
  date!: string;

  @IsString()
  doors!: string;

  @IsIn(dayStatus)
  status!: string;

  @IsIn(["public", "internal"])
  visibility!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  crew!: number;

  @IsString()
  note!: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imageAlt?: string;
}

export class BriefDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  organisation!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn(kinds)
  kind!: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  @MinLength(12)
  brief!: string;

  @IsOptional()
  @IsIn(briefStatus)
  status?: string;
}

export class ClientDto {
  @IsString()
  @MinLength(2)
  organisation!: string;

  @IsString()
  @MinLength(2)
  contact!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RunDto {
  @IsString()
  eventId!: string;

  @IsString()
  time!: string;

  @IsString()
  @MinLength(3)
  task!: string;

  @IsString()
  owner!: string;

  @IsIn(runState)
  state!: string;
}

export class PhotoAltDto {
  @IsOptional()
  @IsString()
  alt?: string;
}

export class ImportDto {
  @Allow()
  events!: DayImport[];

  @Allow()
  inquiries!: BriefImport[];

  @Allow()
  clients!: ClientImport[];

  @Allow()
  run!: RunImport[];
}

type DayImport = DayDto & { id?: string };
type BriefImport = BriefDto & { id?: string; receivedAt?: string };
type ClientImport = ClientDto & { id?: string };
type RunImport = RunDto & { id?: string };
