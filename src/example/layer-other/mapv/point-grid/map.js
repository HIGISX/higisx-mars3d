import * as mars3d from "mars3d"
import axios from "axios"

export let map // mars3d.Map三维地图对象
// const axios = require("axios")

export const mapOptions = {
  scene: {
    center: { lat: 18.2370580, lng: 109.3777565, alt: 10000515, heading: 30001, pitch: -50 }
  },
  control: {
    clockAnimate: true, // 时钟动画控制(左下角)
    timeline: true, // 是否显示时间线控件
    compass: { bottom: "380px", left: "5px" }
  }
}
/**
 * 初始化地图业务，生命周期钩子函数（必须）
 * 框架在地图初始化完成后自动调用该函数
 * @param {mars3d.Map} mapInstance 地图对象
 * @returns {void} 无
 */
export function onMounted(mapInstance) {
  map = mapInstance // 记录首次创建的map

  // 创建mapv图层
  createMapvLayer()
}

/**
 * 释放当前地图业务的生命周期函数
 * @returns {void} 无
 */
export function onUnmounted() {
  map = null
}

function createMapvLayer() {
  // 构造数据
  const positions = []
  const geojson = []
  const x_data = []
  const y_data = []
  const num_data = []
  let data1 = []
  // let randomCount = 300


  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://127.0.0.1:5000/api/tif1", false)
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      data1 = JSON.parse(xhr.responseText)
      // console.log(dataLength)
      // console.log(data.x)
      for (let i = 0; i < data1.x.length; i++) {
        // console.log(data.x[i])
        x_data.push(data1.x[i])
      }

      for (let i = 0; i < data1.y.length; i++) {
        // console.log(data.x[i])
        y_data.push(data1.y[i])
      }


    }
  }
  xhr.send()
  // console.log(data1.data)
  // console.log(data1.data)
  console.log(x_data.length)
  for (let i = 0; i < x_data.length / 1; i += 100) {
    for (let j = 0; j < y_data.length / 1; j += 100) {
      // console.log("aaa")
      // console.log(data1.data[i][j])
      const point = [x_data[i], y_data[j]]
      positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1]))
      geojson.push({
        geometry: {
          type: "Point",
          coordinates: point
        },
        count: data1.data[i][j]
      })
    }
    }

  // while (randomCount--) {
  //   // 取区域内的随机点
  //   const point = [random(113 * 1000, 119 * 1000) / 1000, random(28 * 1000, 35 * 1000) / 1000]
  //
  //   positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1]))
  //
  //   geojson.push({
  //     geometry: {
  //       type: "Point",
  //       coordinates: point
  //     },
  //     count: 30 * Math.random()
  //   })
  //   if (randomCount === 0) {
  //     console.log(point)
  //   }
  //
  // }
  map.camera.flyTo({
    destination: Cesium.Rectangle.fromCartesianArray(positions)
  })

  // mapv图层参数
  const options = {
    draw: "grid",
    fillStyle: "rgba(55, 50, 250, 0.8)",
    shadowColor: "rgba(255, 250, 50, 1)",
    shadowBlur: 20,
    size: 40,
    globalAlpha: 0.5,
    label: {
      show: true,
      fillStyle: "white"
      // shadowColor: 'yellow',
      // font: '20px Arial',
      // shadowBlur: 10,
    },
    gradient: {
      0.25: "rgb(0,0,255)",
      0.55: "rgb(0,255,0)",
      0.85: "yellow",
      1.0: "rgb(255,0,0)"
    },
    data: geojson // 数据
  }

  // 创建MapV图层
  const mapVLayer = new mars3d.layer.MapVLayer(options)
  map.addLayer(mapVLayer)
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
