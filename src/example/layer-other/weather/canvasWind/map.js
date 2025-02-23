/*
 * @Author: DC
 * @Date: 2024-12-11 22:01:28
 * @LastEditTime: 2025-01-02 11:03:51
 * @LastEditors: DC
 * @Description:
 * @FilePath: /mars3d-vue-example-master/src/example/layer-other/weather/canvasWind/map.js
 * Never lose my passion
 */
import * as mars3d from "mars3d"

export let map // mars3d.Map三维地图对象
let canvasWindLayer

// 需要覆盖config.json中地图属性参数（当前示例框架中自动处理合并）
export const mapOptions = {
  scene: {
    // center: { lat: 24.677182, lng: 107.044123, alt: 20407002, heading: 0, pitch: -90 }
    center: { lat: 24.677182, lng: 107.044123, alt: 2040700, heading: 0, pitch: -90 }
  }
}

/**
 * 初始化地图业务，生命周期钩子函数（必须）
 * 框架在地图初始化完成后自动调用该函数
 * @param {mars3d.Map} mapInstance 地图对象
 * @returns {void} 无
 */
export function onMounted(mapInstance) {
  map = mapInstance // 记录map
  map.basemap = 2017 // 蓝色底图
  map.hasTerrain = false

  // 风场
  canvasWindLayer = new mars3d.layer.CanvasWindLayer({
    worker: window.currentPath + "windWorker.js", // 启用多线程模式，注释后是单线程模式(非必须)
    frameRate: 20, // 每秒刷新次数
    speedRate: 60, // 风前进速率
    particlesNumber: 10000,
    maxAge: 120,
    lineWidth: 2,
    // 单颜色
    color: "#ffffff"
    // 多颜色
    // colors: ["rgb(0, 228, 0)", "rgb(256, 256, 0)", "rgb(256, 126, 0)", "rgb(256, 0, 0)", "rgb(153, 0, 76)", "rgb(126, 0, 35)"],
    // steps: [1.0, 2.0, 5.4, 7.9, 10.7, 13.8]
  })
  map.addLayer(canvasWindLayer)

  loadEarthData()
}

/**
 * 释放当前地图业务的生命周期函数
 * @returns {void} 无
 */
export function onUnmounted() {
  map = null
}

// 滑动条事件
// 修改粒子数量
export function changeCount(val) {
  if (val) {
    canvasWindLayer.particlesNumber = val
  }
}

// 修改存活时间
export function changeAge(val) {
  if (val) {
    canvasWindLayer.maxAge = val
  }
}

// 修改移动速率
export function changeSpeed(val) {
  if (val) {
    canvasWindLayer.speedRate = val
  }
}

// 修改线宽
export function changeLinewidth(val) {
  if (val) {
    canvasWindLayer.lineWidth = val
  }
}

// 改变颜色
export function changeColor(color) {
  canvasWindLayer.color = color
}

// 加载全球数据
let earthWindData
// 加载气象
let dongnanWindData

export function loadEarthData() {
  map.flyHome()

  canvasWindLayer.speedRate = 50
  canvasWindLayer.reverseY = false // false时表示 纬度顺序从大到小

  mars3d.Util.fetchJson({ url: "//data.mars3d.cn/file/apidemo/windyuv.json" })
    .then(function (res) {
      if (earthWindData) {
        canvasWindLayer.data = earthWindData
        return
      }
      earthWindData = res
      canvasWindLayer.data = earthWindData

      setTimeout(function () {
        const arrPoints = []
        const particles = canvasWindLayer._canvasParticles
        for (let index = 0, len = particles.length; index < len; index++) {
          const item = particles[index]
          arrPoints.push({ lat: item.lat, lng: item.lng - 180, value: item.speed }) // - 180是针对当前数据特殊处理
        }
        showHeatMap(arrPoints)
      }, 3000)
    })
    .catch(function (err) {
      console.log("请求数据失败!", err)
    })
}

// 加载局部数据
export function loadDongnanData() {
  // map.setCameraView({ lat: 30.484229, lng: 116.627601, alt: 1719951, heading: 0, pitch: -90, roll: 0 })

  canvasWindLayer.speedRate = 85
  canvasWindLayer.reverseY = true // true时表示 纬度顺序从小到到大

  // 访问windpoint.json后端接口，取数据
  mars3d.Util.fetchJson({ url: "//data.mars3d.cn/file/apidemo/windpoint.json" })
    .then(function (res) {
      if (dongnanWindData) {
        canvasWindLayer.data = dongnanWindData
        return
      }
      dongnanWindData = convertWindData(res.data)
      console.log("aaaa")
      console.log(dongnanWindData)
      canvasWindLayer.data = dongnanWindData
      canvasWindLayer.fixedHeight = 60000
      // console.log(canvasWindLayer._canvasParticles.length)
      // 10000
      const data = { canvas1: canvasWindLayer._canvasParticles.length }
      const jsonData = JSON.stringify(data)
      const xhr = new XMLHttpRequest()
      let data1 = []
      xhr.open("POST", "http://127.0.0.1:5000/GetCanvasParticlesLen", false)
      xhr.setRequestHeader("Content-type", "application/json")
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          console.log(response)
        }
      }
      xhr.send(jsonData)

      xhr.open("GET", "http://127.0.0.1:5000/MakeCanvasParticles", false)
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          data1 = JSON.parse(xhr.responseText)
          // console.log(dataLength)
          // console.log(data.x)
        }
      }
      xhr.send()
      map.setCameraView({ lat: data1.lat[0], lng: data1.lng[0], alt: 1719951, heading: 0, pitch: -90, roll: 0 })
      console.log(data1.lat[0])
      console.log(data1.lng[0])

      // 热力图
      setTimeout(function () {
        const arrPoints = []
        const particles = canvasWindLayer._canvasParticles
        for (let index = 0, len = particles.length; index < len; index++) {
          const item = particles[index]
          // console.log(data1.lat[index])
          arrPoints.push({ lat: data1.lat[index], lng: data1.lng[index], value: item.speed })
        }
        showHeatMap(arrPoints)
      }, 3000)
    })
    .catch(function () {
      globalMsg("实时查询气象信息失败，请稍候再试")
    })
}

export function loadDongnanData2() {
  // 160.48103,24.249019
  map.setCameraView({ lat: 160.48103, lng: 24.249019, alt: 10719951, heading: 0, pitch: -90, roll: 0 })

  canvasWindLayer.speedRate = 85
  canvasWindLayer.reverseY = true // true时表示 纬度顺序从小到到大

  // 访问windpoint.json后端接口，取数据
  mars3d.Util.fetchJson({ url: "//data.mars3d.cn/file/apidemo/windpoint.json" })
    .then(function (res) {
      if (dongnanWindData) {
        canvasWindLayer.data = dongnanWindData
        return
      }
      dongnanWindData = convertWindData(res.data)
      canvasWindLayer.data = dongnanWindData
      canvasWindLayer.fixedHeight = 60000

      // 热力图
      setTimeout(function () {
        const arrPoints = []
        const particles = canvasWindLayer._canvasParticles
        for (let index = 0, len = particles.length; index < len; index++) {
          const item = particles[index]
          arrPoints.push({ lat: item.lat, lng: item.lng, value: item.speed })
        }
        showHeatMap(arrPoints)
      }, 3000)
    })
    .catch(function () {
      globalMsg("实时查询气象信息失败，请稍候再试")
    })
}

// 将数据转换为需要的格式:风向转UV
function convertWindData(arr) {
  const arrU = []
  const arrV = []

  let xmin = arr[0].x
  let xmax = arr[0].x
  let ymin = arr[0].y
  let ymax = arr[0].y

  // 风向是以y轴正方向为零度顺时针转，0度表示北风。90度表示东风。
  // u表示经度方向上的风，u为正，表示西风，从西边吹来的风。
  // v表示纬度方向上的风，v为正，表示南风，从南边吹来的风。
  for (let i = 0, len = arr.length; i < len; i++) {
    const item = arr[i]

    if (xmin > item.x) {
      xmin = item.x
    }
    if (xmax < item.x) {
      xmax = item.x
    }
    if (ymin > item.y) {
      ymin = item.y
    }
    if (ymax < item.y) {
      ymax = item.y
    }

    const u = mars3d.WindUtil.getU(item.speed, item.dir)
    arrU.push(u)

    const v = mars3d.WindUtil.getV(item.speed, item.dir)
    arrV.push(v)
    // console.log(arr.length)
    // const u = mars3d.WindUtil.getU(item.speed, data1[i])
    // arrU.push(u)
    //
    // const v = mars3d.WindUtil.getV(item.speed, data1[i])
    // arrV.push(v)
  }

  const rows = getKeyNumCount(arr, "y") // 计算 行数
  const cols = getKeyNumCount(arr, "x") // 计算 列数
  console.log(xmin)
  console.log(xmax)
  console.log(ymin)
  console.log(ymax)
  // 137.81556,31.121372
  // 197.717159,8.316969

  // 111.413715,20.537497
  // 118.128728,18.307735
  xmin = 111.413715
  xmax = 118.128728
  ymax = 20.537497
  ymin = 18.307735

  return {
    xmin,
    xmax,
    ymax,
    ymin,
    rows,
    cols,
    udata: arrU, // 横向风速
    vdata: arrV // 纵向风速
  }
}

function getKeyNumCount(arr, key) {
  const obj = {}
  arr.forEach((item) => {
    obj[item[key]] = true
  })

  let count = 0
  for (const col in obj) {
    count++
  }
  return count
}

let heatLayer

function showHeatMap(arrPoints) {
  if (heatLayer) {
    heatLayer.destroy()
  }

  // 热力图 图层
  heatLayer = new mars3d.layer.HeatLayer({
    positions: arrPoints,
    min: 0,
    max: 20,
    // 以下为热力图本身的样式参数，可参阅api：https://www.patrick-wied.at/static/heatmapjs/docs.html
    heatStyle: {
      radius: 10,
      blur: 0.6,
      minOpacity: 0,
      maxOpacity: 0.6,
      gradient: {
        0: "#e9ec36",
        0.25: "#ffdd2f",
        0.5: "#fa6c20",
        0.75: "#fe4a33",
        1: "#ff0000"
      }
    },
    // 以下为矩形矢量对象的样式参数
    style: {
      opacity: 1.0
    }
  })
  map.addLayer(heatLayer)
}
