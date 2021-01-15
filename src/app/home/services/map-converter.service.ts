import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';

export class IImageDimension {
  w: number;
  h: number;
}

@Injectable({
  providedIn: 'root',
})
export class MapConverterService {
  constructor(private http: HttpClient) {}
  private w: number;
  private h: number;
  private image: string;
  private token =
    'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJMT0lfVXNlciIsIm5iZiI6MTYxMDM1MjYzMSwiZXhwIjoxNjEwOTU3NDMxLCJpYXQiOjE2MTAzNTI2MzF9.grvQJZnQWHCfCPfSu4fvlGh9X_CrC6-STtHi3VAbqUr35UcKB4B1qeynFKXfwjLRPRbz3wcOzwMjDmRLziTvfQ';

  private baseUrl = 'https://localhost:44352/api/';
  dimension = new EventEmitter<IImageDimension>();

  async getPng() {
    // Con Get da server
    var header = new HttpHeaders({
      Authorization: 'Bearer ' + this.token,
    });
    const blob = await this.http
      .get(this.baseUrl + 'map/e818259a-b24f-4e28-d0e9-08d880c53a0a', {
        headers: header,
        responseType: 'blob',
      })
      .toPromise();
    this.image = URL.createObjectURL(blob);
    return this.image;

    // Get data from file (need to hardcode the height and width)
    // const occupancyGrid = await this.getDataFromFile();
    // return this.convertData(occupancyGrid);
  }

  getDimension() {
    var img = new Image();
    img.src = this.image;
    img.onload = (event: any) => {
      var imageDimension: IImageDimension = {
        w: event.currentTarget?.width,
        h: event.currentTarget?.height,
      };
      this.dimension.emit(imageDimension);
    };
  }

  //#region  Get Data from File
  private async getDataFromFile() {
    // Con get da file
    var mapData = {
      data: './../../../assets/images/defined_map.txt',
      width: 3264,
      height: 3712,
    };
    this.w = mapData.width;
    this.h = mapData.height;
    var occupancyGrid: any = await this.http.get(mapData.data).toPromise();
    return occupancyGrid;
  }

  private convertData(occupancyGrid: any | number[]) {
    const data = new Uint8ClampedArray(this.w * this.h * 4);

    for (let i = 0; i < occupancyGrid.length; i++) {
      switch (occupancyGrid[i]) {
        case -1:
          // Unknown Area
          data[4 * i] = 112; // r
          data[4 * i + 1] = 98; // g
          data[4 * i + 2] = 94; // b
          data[4 * i + 3] = 200; // a
          break;

        case 0:
          // Free Area
          data[4 * i] = 254; // r
          data[4 * i + 1] = 250; // g
          data[4 * i + 2] = 250; // b
          data[4 * i + 3] = 255; // a
          break;

        case 100:
          // Busy Area
          data[4 * i] = 0; // r
          data[4 * i + 1] = 0; // g
          data[4 * i + 2] = 0; // b
          data[4 * i + 3] = 255; // a
          break;

        default:
          data[4 * i] = 255; // r
          data[4 * i + 1] = 0; // g
          data[4 * i + 2] = 0; // b
          data[4 * i + 3] = 255; // a
          break;
      }
    }
    const image = this.getDataUrlFromArr(data);
    return image;
  }

  private getDataUrlFromArr(arr: Uint8ClampedArray) {
    if (typeof this.w === 'undefined' || typeof this.h === 'undefined') {
      this.w = this.h = Math.sqrt(arr.length / 4);
    }
    const canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = this.w;
      canvas.height = this.h;

      const imgData = ctx.createImageData(this.w, this.h);
      imgData.data.set(arr);
      ctx.putImageData(imgData, 0, 0);
      this.flipImage(ctx, canvas);
    }
    return canvas.toDataURL();
  }

  private flipImage(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.globalCompositeOperation = 'copy';
    ctx.scale(1, -1); // Y flip
    ctx.translate(0, -canvas.height); // so we can draw at 0,0
    ctx.drawImage(canvas, 0, 0);
    // now we can restore the context to defaults if needed
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Other algorithm to flip image
    // const data = imgData?.data;
    // Array.from({ length: h }, (val, i) =>
    //   data?.slice(i * w * 4, (i + 1) * w * 4)
    // ).forEach((val, i) => data?.set(val, (h - i - 1) * w * 4));
  }

  //#endregion
}
