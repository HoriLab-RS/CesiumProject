(function () {
"use strict";

// Cesium ion トークンの設定
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTEzNmFmYS1hNzA5LTQ2YjQtYTc0OC1iZTg3ODNhOTVlMTIiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NjE0Njg5Mjh9._9Bw9jDFFjHSKkrklCs3s_zMuPg7q3flgzezAHf7mio';


    // 【修正点 1】ベースマップを読み込まない設定を追加
    var viewer = new Cesium.Viewer("cesium", {
        baseLayerPicker: false, // ベースレイヤー選択ウィジェットを非表示
        // Cesiumのデフォルト画像を読み込まない
        baseLayer: false
    }); 

    // 【修正点 2】デフォルトで入っている画像をすべて消去（重要）
    viewer.scene.imageryLayers.removeAll();

    // 【追加点】Google Photorealistic 3D Tiles の追加
    // アセットID 2275207 を指定して、3Dデータレイヤーを追加します。
    viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(2275207)
        })
    );


//初期の視点（カメラ）の位置 日本の上空にカメラが来るように設定。
viewer.camera.setView({
destination: Cesium.Cartesian3.fromDegrees(138, 29, 500000),
orientation: {
heading: 0, // 水平方向の回転度（ラジアン）
pitch: -1.4, // 垂直方向の回転度（ラジアン） 上を見上げたり下を見下ろしたり
roll: 0
}
}
);


// 【変更点】ここから追加: ズームイン処理の関数とイベントリスナー

    /**
     * 指定した座標にアニメーションでカメラを移動させる関数
     * @param {number} lon 経度
     * @param {number} lat 緯度
     * @param {number} height 高度（メートル）
     */
    function zoomToLocation(lon, lat, height) {
        viewer.camera.flyTo({
            // 九州大学博物館の座標 (33.6190, 130.4357) と高度1000m
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            duration: 3 // アニメーションにかける時間（秒）
        });
    }

    // ボタン要素を取得
    var button = document.getElementById("zoomToKyudai");

    // ボタンがクリックされたら、特定の場所にズームインする
    button.addEventListener('click', function() {
        // 九州大学博物館の座標
        var kyudaiLon = 130.425757; 
        var kyudaiLat = 33.622580;
        var height = 150;

        zoomToLocation(kyudaiLon, kyudaiLat, height);
    });

    // 【変更点】ここまで追加


})();