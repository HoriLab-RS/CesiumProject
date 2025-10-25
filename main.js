(function() {
  "use strict";

  var viewer = new Cesium.Viewer("cesium");

	//初期の視点（カメラ）の位置 日本の上空にカメラが来るように設定。
  viewer.camera.setView({
   destination: Cesium.Cartesian3.fromDegrees(138, 29, 4000000),
   orientation: {
     heading: 0, // 水平方向の回転度（ラジアン）
     pitch: -1.4, // 垂直方向の回転度（ラジアン） 上を見上げたり下を見下ろしたり
     roll: 0
  }
});

}());
