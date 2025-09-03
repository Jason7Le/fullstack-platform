import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail({}, { message: '请输入有效的邮箱地址' })
    email: string;

    @IsString()
    @MinLength(6, { message: '密码至少需要6位数' })
    password: string;

    @IsString()
    @MinLength(2, { message: '姓名至少需要2个字符' })
    name: string;

    @IsOptional()
    @IsEnum(['admin', 'user', 'guest'], {
        message: '角色必须是admin、user或者guest',
    })
    role?: string;
}
