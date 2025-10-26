(function () {
    "use strict";

    // 1. Ion トークンの設定
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlODQ3ODQ4MS1lYzRkLTRiNjktYWM4ZC00NTI5NDdmNjA4OTYiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NTk0ODMzOTd9.sDxu7nvzcLpy0IPq1PVkmTgsXhkJmJLYiOkorN1L-2M';

    // 2. ビューアの初期化とベースマップの無効化
    var viewer = new Cesium.Viewer("cesium", {
        baseLayerPicker: false,
        baseLayer: false // デフォルト画像を読み込まない
    });
    
    // 3. 既存の画像レイヤーをすべて消去（重要）
    viewer.scene.imageryLayers.removeAll();

    // 4. Google Photorealistic 3D Tiles の追加
    viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(2275207)
        })
    );
    
    // 5. 初期視点の設定（高度を 500km に下げて強制的にデータ読み込みを促す）
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(138, 29, 500000), 
        orientation: {
            heading: 0,
            pitch: -1.4, 
            roll: 0
        }
    });

    // 6. ズームイン処理の関数定義
    function zoomToLocation(lon, lat, height) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            duration: 3
        });
    }

    // 7. ボタンイベントリスナー
    var button = document.getElementById("zoomToKyudai");

    button.addEventListener('click', function() {
        var kyudaiLon = 130.425757; 
        var kyudaiLat = 33.622580;
        var height = 150; // 建物が見える 150m に設定

        zoomToLocation(kyudaiLon, kyudaiLat, height);
    });

    // 8. Entity（マーカー）の追加
    viewer.entities.add({
        name: "九州大学総合研究博物館",
        position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50),
        billboard: {
            image: "https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Widgets/Images/Cesium_Logo_overlay.png",
            width: 32,
            height: 32
        },
        description: `<h1>九州大学総合研究博物館</h1><p>ボタンでズームインするとピンが見えます。</p>`
    });
    
})(); // 最後の行