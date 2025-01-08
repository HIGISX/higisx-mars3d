import * as mars3d from "mars3d"
// import { Array2DGridDataProvider } from "@quickearth/core"

const { consts, DataAnimationService, getBinary, GridDataGLFillMode, QEGridDataProvider, resourceService, Array2DGridDataProvider } = window.QE // quickearth.core.js
const { CPixelLayer } = window.QEC // quickearth.cesium.js

export let map // mars3d.Map三维地图对象

// 需要覆盖config.json中地图属性参数（当前示例框架中自动处理合并）
export const mapOptions = {
  scene: {
    center: { lat: 30.054604, lng: 108.885436, alt: 17036414, heading: 0, pitch: -90 }
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

  initDemoData()
}

/**
 * 释放当前地图业务的生命周期函数
 * @returns {void} 无
 */
export function onUnmounted() {
  map = null
}

async function initDemoData() {
  globalMsg("数据加载中...")
  showLoading()

  // public静态资源的路径
  consts.resourcePath = "//data.mars3d.cn/file/qe"
  // consts.defaultLegendPath = "//data.mars3d.cn/file/qe/styles/colors"
  // consts.wasmPath = "/lib/mars3d/thirdParty/quickearth/wasm"
  // consts.workerPath = "/lib/mars3d/thirdParty/quickearth/workers"

  // config资源配置
  await resourceService.loadResourceFromConfigPath("styles/demo.config.json")

  await createTempAnimation()

  globalMsg("数据加载完成")
  hideLoading()
}

async function createTempAnimation() {

  let data1 = []
  const nc_data = []
  const xSize = 100
  const ySize = 100
  const cX = xSize / 2
  const cY = ySize / 2
  const dataArr = []
  const maxLen = Math.sqrt(cX * cX + cY * cY)
  for (let i = 0; i < ySize; i++) {
    for (let j = 0; j < xSize; j++) {
      // dataArr.push(1 - Math.sqrt((cX - j) * (cX - j) + (cY - i) * (cY - i)) / maxLen)
      // dataArr.push(Math.random(-33, 48))
      dataArr.push(Math.floor(Math.random() * (48 - (-33) + 1) + (-33)))
      // dataArr.push(Math.floor(10))
    }
  }
  const options = {
    xStart: 110.57072766159034,
    xEnd: 109.0254622190309,
    yStart: 19.77854587771838,
    yEnd: 18.58542778584455,
    xSize: 100,
    ySize: 100
  }
  const provider2 = new Array2DGridDataProvider(dataArr, { gridOptions: options })




  const buffers = await getBinary("src/year.ano.zip")
  const provider = new QEGridDataProvider(buffers[0])

  console.log(provider)

  console.log(provider.meta)
  console.log(provider.allGrids())
  console.log(provider.allGrids().length)
  console.log(provider.allGrids()[0].length)
  console.log(provider.allGrids()[0][0]._raw.length)


  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://127.0.0.1:5000/api/nc1", false)
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      data1 = JSON.parse(xhr.responseText)
      for (let i = 0; i < data1.data.length; i++) {
        // console.log(data.x[i])
        for (let j = 0; j < data1.data[i].length; j++) {
          // console.log(data1.data[i][j])
          nc_data.push(data1.data[i][j])
        }

      }


    }
  }
  xhr.send()
  console.log("---")
  console.log(nc_data.length)

  for (let i = 0; i < provider.allGrids().length; i++) {
    // console.log(provider.allGrids()[i][0]._raw.length)
    for (let j = 0; j < provider.allGrids()[i].length; j++) {
      for (let k = 0; k < provider.allGrids()[i][j]._raw.length; k++) {
        // console.log(provider.allGrids()[i][j]._raw[k])
        provider.allGrids()[i][j]._raw[k] = nc_data[k]
      }
    }
  }

  // console.log(provider.allGrids())
  // console.log(provider.allGrids().length)
  // console.log(provider.allGrids()[0].length)
  // console.log(provider.allGrids()[0][0]._raw.length)


  const layer = new CPixelLayer({
    interpFromPreSource: true
  })
    .setDrawOptions({
      fillColor: "color-temp-ano#res",
      // fillColor: "color-precp#res",
      // fillMode: GridDataGLFillMode.shaded2,
      fillMode: GridDataGLFillMode.pixel1,
      fillModeForLine: GridDataGLFillMode.shaded2,
      lineColor: "white",
      showLine: true
    })
    .setDataSource(provider)
  map.scene.primitives.add(layer)

  const aniService = new DataAnimationService(provider, {
    layer: layer,
    all: provider.allGrids().length
  })
  aniService.start()
}
