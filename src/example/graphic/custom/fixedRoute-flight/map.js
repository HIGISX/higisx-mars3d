import * as mars3d from "mars3d"

export let map // mars3d.Map三维地图对象

// 需要覆盖config.json中地图属性参数（当前示例框架中自动处理合并）
export const mapOptions = {
  scene: {
    center: { lat: 18.2370580, lng: 109.3777565, alt: 1515, heading: 301, pitch: -50 }
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

    [109.3777565, 18.2370580, 418.5],

    [109.3938541, 18.2601310, 486.1],

    [109.4214501, 18.2722156, 1133.1],

    [109.4674433, 18.2864963, 1156.7],

    [109.5042379, 18.3029726, 1244],

    [109.5260847, 18.2678213, 1299.4],

    [109.5364332, 18.2425518, 1333.4],

    [109.5490813, 18.2612296, 1377.1],

    [109.6054230, 18.2073881, 1422.6],

    [109.6617648, 18.3040710, 1434.4],

    [109.7158068, 18.3348223, 1259.3],

    [109.7629499, 18.3963082, 1240.5],

    [109.8077933, 18.4292380, 1227.8],

    [109.8664347, 18.4105786, 1223.1],

    [109.9262259, 18.4237501, 1221.3],

    [110.0223805, 18.40042486, 1221.2]


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
      url: "src/MQ-9-Predator.glb",
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

