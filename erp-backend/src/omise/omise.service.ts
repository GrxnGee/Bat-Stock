import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const omise = require('omise');

@Injectable()

export class OmiseService {

    private omiseClient;

    constructor(private configService: ConfigService) {

        const publicKey = this.configService.get<string>('OMISE_PUBLIC_KEY');
        const secretKey = this.configService.get<string>('OMISE_SECRET_KEY');

        this.omiseClient = omise({
            publicKey: publicKey,
            secretKey: secretKey,

        });
    }



    async createPromptPayCharge(amount: number) {
        try {
            const charge = await this.omiseClient.charges.create({
                amount: amount * 100,
                currency: 'thb',
                source: { type: 'promptpay' },
            });

            return {
                success: true,
                chargeId: charge.id,
                qrCodeUrl: charge.source.scannable_code.image.download_uri,
            };
        } catch (error: any) {
            console.error('Omise Error:', error);
            throw new BadRequestException('ไม่สามารถสร้าง QR Code ได้: ' + error.message);
        }
    }

    async checkChargeStatus(chargeId: string) {
        try {
            const charge = await this.omiseClient.charges.retrieve(chargeId);
            return {
                success: true,
                status: charge.status,
            };
        } catch (error: any) {
            throw new BadRequestException('ตรวจสอบสถานะไม่สำเร็จ: ' + error.message);
        }
    }
}