import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RadiographsService } from '../application/radiographs.service';
import { CreateRadiographDto } from '../application/dto/create-radiograph.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('radiographs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RadiographsController {
  constructor(private readonly radiographsService: RadiographsService) {}

  @Post('upload')
  @Roles('DENTIST', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: UserContext,
    @UploadedFile() file: any,
    @Body() createDto: CreateRadiographDto,
  ) {
    return this.radiographsService.uploadRadiograph(user.tenantId, user.userId, file, createDto);
  }

  @Get('patient/:patientId')
  async findAllByPatient(
    @CurrentUser() user: UserContext,
    @Param('patientId') patientId: string,
    @Query('type') imageType?: string,
  ) {
    return this.radiographsService.findAllByPatient(user.tenantId, patientId, imageType);
  }

  @Get('patient/:patientId/tooth/:toothNumber')
  async findByTooth(
    @CurrentUser() user: UserContext,
    @Param('patientId') patientId: string,
    @Param('toothNumber') toothNumber: string,
  ) {
    return this.radiographsService.findByTooth(user.tenantId, patientId, toothNumber);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.radiographsService.delete(user.tenantId, id);
    return { success: true };
  }
}
