(function () {
"use strict";

// 【ここから追加】Cesium ion トークンの設定
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlODQ3ODQ4MS1lYzRkLTRiNjktYWM4ZC04NTI5NDdmNjA4OTYiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NTk0ODMzOTd9.sDxu7nvzcLpy0IPq1PVkmTgsXhkJmJLYiOkorN1L-2M';
// 【ここまで追加】

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

}()); // 最後の行の () はそのまま