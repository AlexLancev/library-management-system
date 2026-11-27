import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO для POST /genres.
 *
 * - name: 2..100 символов.
 * - slug: [a-z0-9-], lowercase, 2..100 символов.
 */
export class CreateGenreDto {
  @IsString()
  @MinLength(2, { message: 'Название должно быть не короче 2 символов' })
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2, { message: 'Slug должен быть не короче 2 символов' })
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug должен содержать только строчные латинские буквы, цифры и дефисы',
  })
  slug!: string;
}