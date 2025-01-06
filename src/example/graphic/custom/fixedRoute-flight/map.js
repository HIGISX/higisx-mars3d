import * as mars3d from "mars3d"

export let map // mars3d.Map三维地图对象

// 需要覆盖config.json中地图属性参数（当前示例框架中自动处理合并）
export const mapOptions = {
  scene: {
    center: { lat: 19.319438, lng: 110.204605, alt: 1515, heading: 301, pitch: -50 }
  },
  control: {
    clockAnimate: true, // 时钟动画控制(左下角)
    timeline: true, // 是否显示时间线控件
    compass: { bottom: "380px", left: "5px" }
  }
}

export const eventTarget = new mars3d.BaseClass() // 事件对象，用于抛出事件到组件中

/**
 * 初始化地图业务，生命周期钩子函数（必须）
 * 框架在地图初始化完成后自动调用该函数
 * @param {mars3d.Map} mapInstance 地图对象
 * @returns {void} 无
 */
export function onMounted(mapInstance) {
  map = mapInstance // 记录map
  map.toolbar.style.bottom = "55px" // 修改toolbar控件的样式

  addGraphicLayer()
}

/**
 * 释放当前地图业务的生命周期函数
 * @returns {void} 无
 */
export function onUnmounted() {
  map = null
}

export let fixedRoute

function addGraphicLayer() {
  // 创建矢量数据图层
  const graphicLayer = new mars3d.layer.GraphicLayer()
  map.addLayer(graphicLayer)

  const positions = [
    [108.37, 18.10, 418.5],

    [108.37, 20.10, 434.9],
    [111.03, 20.10, 438.5],

    [111.03, 18.10, 500.9],

    [108.37, 18.10, 1221.2]
  ]

  fixedRoute = new mars3d.graphic.FixedRoute({
    name: "飞机航线",
    speed: 100,
    startTime: "2025-01-05 09:00:00",
    positions,
    // "clockLoop": true,      //是否循环播放
    clockRange: Cesium.ClockRange.CLAMPED, // CLAMPED 到达终止时间后停止
    camera: {
      type: "gs",
      heading: -84,
      radius: 500
    },
    model: {
      url: "//data.mars3d.cn/gltf/mars/MQ-9-Predator.glb",
      scale: 1,
      // heading: 0,
      minimumPixelSize: 100
    },
    path: {
      color: "rgba(255,255,0,0.5)",
      width: 1,
      leadTime: 0
    },
    wall: {
      color: "rgba(0,255,255,0.5)",
      surface: true
    }
  })
  graphicLayer.addGraphic(fixedRoute)

  // 添加视频对象
  addVideoDemo()

  // 绑定popup
  bindPopup(fixedRoute)

  // ui面板信息展示
  fixedRoute.on(mars3d.EventType.change, mars3d.Util.funThrottle((event) => {
    // 取实时信息，可以通过  fixedRoute.info
    eventTarget.fire("roamLineChange", event)
  }, 500))

  // fixedRoute.start()
  // fixedRoute.openPopup()

  // 修改控件对应的时间
  map.clock.currentTime = fixedRoute.startTime
  if (map.control.timeline) {
    map.control.timeline.zoomTo(fixedRoute.startTime, fixedRoute.stopTime)
  }
}

// 改变视角模式
export function updateCameraSetting(data) {
  const cameraType = data.select
  const followedX = data.followedX
  const followedZ = data.followedZ
  const offsetZ = data.offsetZ
  const offsetY = data.offsetY
  const offsetX = data.offsetX

  fixedRoute.setCameraOptions({
    type: cameraType,
    radius: cameraType === "gs" ? followedX : 0,
    followedX,
    followedZ,
    offsetZ,
    offsetY,
    offsetX
  })
}

function bindPopup(fixedRoute) {
  fixedRoute.bindPopup(
    `<div style="width: 200px">
      <div>总 距 离：<span id="lblAllLen"> </span></div>
      <div>总 时 间：<span id="lblAllTime"> </span></div>
      <div>开始时间：<span id="lblStartTime"> </span></div>
      <div>剩余时间：<span id="lblRemainTime"> </span></div>
      <div>剩余距离：<span id="lblRemainLen"> </span></div>
    </div>`,
    { closeOnClick: false }
  )

  // 刷新局部DOM,不影响popup面板的其他控件操作
  fixedRoute.on(mars3d.EventType.popupRender, function (event) {
    const container = event.container // popup对应的DOM

    const params = fixedRoute?.info
    if (!params) {
      return
    }

    const lblAllLen = container.querySelector("#lblAllLen")
    if (lblAllLen) {
      lblAllLen.innerHTML = mars3d.MeasureUtil.formatDistance(params.distance_all)
    }

    const lblAllTime = container.querySelector("#lblAllTime")
    if (lblAllTime) {
      lblAllTime.innerHTML = mars3d.Util.formatTime(params.second_all / map.clock.multiplier)
    }

    const lblStartTime = container.querySelector("#lblStartTime")
    if (lblStartTime) {
      lblStartTime.innerHTML = mars3d.Util.formatDate(Cesium.JulianDate.toDate(fixedRoute.startTime), "yyyy-M-d HH:mm:ss")
    }

    const lblRemainTime = container.querySelector("#lblRemainTime")
    if (lblRemainTime) {
      lblRemainTime.innerHTML = mars3d.Util.formatTime((params.second_all - params.second) / map.clock.multiplier)
    }

    const lblRemainLen = container.querySelector("#lblRemainLen")
    if (lblRemainLen) {
      lblRemainLen.innerHTML = mars3d.MeasureUtil.formatDistance(params.distance_all - params.distance) || "完成"
    }
  })
}

// ui层使用
export const formatDistance = mars3d.MeasureUtil.formatDistance
export const formatTime = mars3d.Util.formatTime


function addVideoDemo() {
  const video2D = new mars3d.graphic.Video2D({
    position: new Cesium.CallbackProperty((time) => {
      return fixedRoute.position
    }, false),
    style: {
      url: "//data.mars3d.cn/file/video/lukou.mp4",
      angle: 40,
      angle2: 20,
      heading: -84,
      distance: 20,
      showFrustum: true
    }
  })
  map.graphicLayer.addGraphic(video2D)

  fixedRoute.on(mars3d.EventType.change, function (event) {
    video2D.style.heading = fixedRoute.heading
    video2D.style.pitch = fixedRoute.pitch
    video2D.style.roll = fixedRoute.roll
  })
}
