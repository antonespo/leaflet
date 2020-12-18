import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import * as Leaflet from 'leaflet';
import { antPath } from 'leaflet-ant-path';
import 'leaflet-draw';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon-2x.png';

export interface ILayer {
  layerName: string;
  enabled: boolean;
  editable: boolean;
  features: FeatureType[];
  color: string;
}

export interface IMapProps {
  drawable: boolean;
  editable: boolean;
}

export enum FeatureType {
  polyline,
  polygon,
  rectangle,
  circle,
  marker,
}

interface FeatureAvailable {
  polyline?: boolean;
  polygon?: boolean;
  rectangle?: boolean;
  circle?: boolean;
  marker?: boolean;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() layers: ILayer[];
  @Input() mapProps: IMapProps;
  private map: Leaflet.DrawMap;
  private editableLayer: Leaflet.FeatureGroup<any>;
  private baseMaps: Leaflet.Control.LayersObject;
  private overlays: { [key: string]: Leaflet.FeatureGroup } = {};

  constructor() {}

  ngAfterViewInit(): void {
    this.initMap();
    // this.addDeliveryPoints();
    this.layersCreation();
    this.addLayersToMap();
    if (this.mapProps.drawable) this.enableDrawControl(this.mapProps.editable);
  }

  ngOnDestroy() {
    this.map.remove();
  }

  printer(layer: Leaflet.Layer) {
    switch (true) {
      case layer instanceof Leaflet.Rectangle:
        return `The Rectangle coordinates are: \n${(layer as Leaflet.Rectangle)
          .getLatLngs()
          .toString()}`;
        break;

      case layer instanceof Leaflet.Circle:
        return `The Circle coordinates are: \n${(layer as Leaflet.Circle)
          .getLatLng()
          .toString()} \nThe Circle radius is: \n ${(layer as Leaflet.Circle)
          .getRadius()
          .toString()}`;
        break;

      case layer instanceof Leaflet.Polygon:
        return `The Polygon coordinates are: \n${(layer as Leaflet.Polygon)
          .getLatLngs()
          .toString()}`;
        break;

      case layer instanceof Leaflet.Marker:
        return `The Marker coordinates are: \n${(layer as Leaflet.Marker)
          .getLatLng()
          .toString()}`;
        break;

      case layer instanceof Leaflet.Polyline:
        return `The Polyline coordinates are: \n${(layer as Leaflet.Polyline)
          .getLatLngs()
          .toString()}`;
        break;

      default:
        return '';
        break;
    }
  }

  // addDeliveryPoints() {
  //   var marker = Leaflet.marker([41.125278, 16.866667], {
  //     draggable: false,
  //   });
  //   marker.addTo(this.overlays.DeliveryPoints);
  // }

  initMap() {
    // openstreet tile layer and its settings
    const OpenStreet = Leaflet.tileLayer(
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: 'openstreetmap',
        noWrap: true,
      }
    );

    const Google = Leaflet.tileLayer(
      'http://www.google.cn/maps/vt?lyrs=s@189&gl=tr&x={x}&y={y}&z={z}',
      {
        attribution: 'google',
        noWrap: true,
      }
    );

    // leaflet map init
    this.map = Leaflet.map('map', {
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      layers: [OpenStreet],
    }).setView([41.125278, 16.866667], 16);

    const scale = Leaflet.control.scale();
    scale.addTo(this.map);
    this.baseMaps = { Google, OpenStreet };
  }

  findLayerByFeature(feature: FeatureType) {
    var layer: ILayer | undefined;
    this.layers.forEach((l) => {
      if (l.features.includes(feature)) layer = l;
    });
    return layer;
  }

  listAvailableFeatures() {
    var features: FeatureAvailable = {};
    this.layers.forEach((layer) => {
      layer.features.forEach((feature) => {
        switch (feature) {
          case FeatureType.circle:
            features.circle = true;
            break;
          case FeatureType.marker:
            features.marker = true;
            break;
          case FeatureType.polygon:
            features.polygon = true;
            break;
          case FeatureType.polyline:
            features.polyline = true;
            break;
          case FeatureType.rectangle:
            features.rectangle = true;
            break;
          default:
            break;
        }
      });
    });
    return features;
  }

  layersCreation() {
    this.layers.forEach((layer) => {
      this.overlays[`${layer.layerName}`] = new Leaflet.FeatureGroup();
      if (layer.enabled) {
        this.overlays[`${layer.layerName}`].addTo(this.map);
      }
      if (layer.editable) {
        this.editableLayer = this.overlays[`${layer.layerName}`];
      }
    });
  }

  addLayersToMap() {
    const layers = Leaflet.control.layers(this.baseMaps, this.overlays, {
      collapsed: false,
      hideSingleBase: true,
    });
    layers.addTo(this.map);
  }

  createFeatureHandler() {
    this.map.on('draw:created', (e: any) => {
      var layer = e.layer;
      switch (e.layerType) {
        case 'polyline':
          var lay = this.findLayerByFeature(FeatureType.polyline);
          break;
        case 'polygon':
          var lay = this.findLayerByFeature(FeatureType.polygon);
          break;
        case 'rectangle':
          var lay = this.findLayerByFeature(FeatureType.rectangle);
          break;
        case 'circle':
          var lay = this.findLayerByFeature(FeatureType.circle);
          break;
        case 'marker':
          var lay = this.findLayerByFeature(FeatureType.marker);
          break;

        default:
          break;
      }
      layer.options.color = lay?.color;
      layer.bindTooltip(this.printer(layer));

      if (lay) layer.addTo(this.overlays[`${lay.layerName}`]);

      alert(this.printer(layer));
    });
  }

  editFeatureHandler() {
    this.map.on('draw:edited', (e: any) => {
      let layers = e.layers;
      layers.eachLayer((layer: Leaflet.Layer) => {
        alert(this.printer(layer));
      });
    });
  }

  createDrawObject() {
    var availableFeature = this.listAvailableFeatures();
    var draw: Leaflet.Control.DrawOptions = {};
    if (!availableFeature.circle) draw.circle = false;
    if (!availableFeature.marker) draw.marker = false;
    if (!availableFeature.polygon) draw.polygon = false;
    if (!availableFeature.polyline) draw.polyline = false;
    if (!availableFeature.rectangle) draw.rectangle = false;
    draw.circlemarker = false;
    return draw;
  }

  enableDrawControl(editMode: boolean) {
    this.map.zoomIn();
    var options: Leaflet.Control.DrawConstructorOptions;
    var edit: Leaflet.Control.EditOptions = {
      featureGroup: this.editableLayer,
    };
    var draw = this.createDrawObject();
    if (editMode) {
      options = { draw, edit };
    } else {
      options = { draw };
    }
    var drawEditControl = new Leaflet.Control.Draw(options);
    this.map.addControl(drawEditControl);
    this.createFeatureHandler();
    this.editFeatureHandler();
  }

  oldStuff() {
    // const printAlert = <T>(type: T, latlng: string, radius?: string )=>{
    //   var text = `The Rectangle coordinates are: \n${latlng} \n`
    //   if()
    // }
    // map.on(Leaflet.Draw.Event.CREATED, (e: any) => {
    //   var type = e.layerType,
    //     layer = e.layer;
    //   if (type === 'marker') {
    //     // Do marker specific actions
    //   }
    //   // Do whatever else you need to. (save to db; add to map etc)
    //   map.addLayer(layer);
    // });
    // var imageUrl = '../../../assets/images/map_plant.png';
    // Leaflet.imageOverlay(
    //   imageUrl,
    //   [
    //     [0, 0],
    //     [10, 10],
    //   ],
    //   { opacity: 1 }
    // ).addTo(this.map);
    // var circle = Leaflet.circle([5, 5], {
    //   color: 'red',
    //   fillColor: '#f03',
    //   fillOpacity: 0.5,
    //   radius: 5000,
    // }).addTo(this.map);
    // circle.bindPopup('<b>Hello world!</b><br>I am a circle.').openPopup();
    // // antPath(
    // //   [
    // //     [28.6448, 77.216721],
    // //     [34.1526, 77.5771],
    // //   ],
    // //   { color: '#FF0000', weight: 5, opacity: 0.6 }
    // // ).addTo(this.map);
    // this.map = Leaflet.map('map', { crs: Leaflet.CRS.Simple, minZoom: -1 });
    // var bounds = [
    //   [0, 0],
    //   [1000, 1000],
    // ] as Leaflet.LatLngBoundsExpression;
    // var imageUrl = '../../../assets/images/map_plant.png';
    // Leaflet.imageOverlay(imageUrl, bounds).addTo(this.map);
    // this.map.fitBounds(bounds);
    // var markerPos = Leaflet.latLng([100, 100]);
    // var marker = Leaflet.marker(markerPos, {
    //   draggable: true,
    // }).addTo(this.map);
    // marker.on('drag', (e) => console.log(e));
  }
}
