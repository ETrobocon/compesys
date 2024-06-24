import CustomJsonResponse from '@/interfaces/response/customJson';

export default interface CustomErrorJsonResponse extends CustomJsonResponse {
  message: string;
}
