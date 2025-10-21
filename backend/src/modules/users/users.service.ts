import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile) private readonly profileRepo: Repository<UserProfile>,
  ) {}

async findByEmail(mun_email: string) {
    return this.userRepo.findOne({ where: { mun_email } });
  }

  async create(mun_email: string, first_name = '') {
    const user = this.userRepo.create({ mun_email, first_name, is_email_verified: false });
    return this.userRepo.save(user);
  }

  async findOrCreate(mun_email: string, first_name = '') {
    let user = await this.findByEmail(mun_email);
    if (!user) user = await this.create(mun_email, first_name);
    return user;
  }

  async setPassword(mun_email: string, password_hash: string) {
    await this.userRepo.update({ mun_email }, { password_hash: password_hash });
    return this.findByEmail(mun_email);
  }

  async markVerified(mun_email: string) {
    await this.userRepo.update({ mun_email }, { is_email_verified: true });
    return this.findByEmail(mun_email);
  }

  async findOne(user_id: string) {
    const user = await this.userRepo.findOne({ where: { user_id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findProfile(user_id: string) {
    const profile = await this.profileRepo.findOne({ where: { user_id } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateUser(user_id: string, dto: UpdateUserDto) {
    await this.findOne(user_id); // ensure exists
    await this.userRepo.update({ user_id }, dto);
    // return selected fields, not password_hash
    const { password_hash, ...safe } = await this.findOne(user_id) as any;
    return safe;
  }

  async upsertProfile(user_id: string, dto: UpdateProfileDto) {
    // Convert rating number → string with 2 decimals to fit DECIMAL(3,2)
    const ratingStr = dto.rating != null ? dto.rating.toFixed(2) : undefined;

    let profile = await this.profileRepo.findOne({ where: { user_id } });
    if (!profile) {
      profile = this.profileRepo.create({ user_id });
    }
    Object.assign(profile, { ...dto, rating: ratingStr ?? profile?.rating });
    return this.profileRepo.save(profile);
  }
}