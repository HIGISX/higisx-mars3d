import * as mars3d from "mars3d"

export let map // mars3d.Map三维地图对象

// 事件对象，用于抛出事件给面板
export const eventTarget = new mars3d.BaseClass()

// 需要覆盖config.json中地图属性参数（当前示例框架中自动处理合并）
export const mapOptions = {
  scene: {
    center: { lat: 30.857767, lng: 116.347782, alt: 769.8, heading: 355, pitch: -37.1 }
  }
}

let graphic

/**
 * 初始化地图业务，生命周期钩子函数（必须）
 * 框架在地图初始化完成后自动调用该函数
 * @param {mars3d.Map} mapInstance 地图对象
 * @returns {void} 无
 */
export function onMounted(mapInstance) {
  map = mapInstance // 记录map

  graphic = new mars3d.graphic.ModelPrimitive({
    name: "警车",
    position: [116.346929, 30.861947, 401.34],
    style: {
      url: "//data.mars3d.cn/gltf/mars/jingche/jingche.gltf",
      scale: 20,
      minimumPixelSize: 50,
      heading: 90
    },
    // graphic.colorCorrection 是 graphic.colorCorrection对象，因为与模型是1对1关系，已经内置进去
    colorCorrection: {
      brightness: 1.0
    },
    attr: { remark: "示例1" }
  })
  map.graphicLayer.addGraphic(graphic)
}

/**
 * 释放当前地图业务的生命周期函数
 * @returns {void} 无
 */
export function onUnmounted() {
  map = null
}

// 是否开启特效
export function setDepthOfField(val) {
  graphic.colorCorrection.enabled = val
}
// 修改对应参数
export function setBrightness(val) {
  graphic.colorCorrection.brightness = val
}

export function setContrast(val) {
  graphic.colorCorrection.contrast = val
}

export function setHue(val) {
  graphic.colorCorrection.hue = val
}

export function setSaturation(val) {
  graphic.colorCorrection.saturation = val
}