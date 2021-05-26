
# font-optimize-vue-plugin-master

这个webpack插件用于字体文件大小优化、字体格式转换以及相应的CSS代码适配。

只支持TTF/OTF/SVG格式作为原始字体，OTF字体无法精简，生成的其它格式可精简化。

### 详情

- 字体优化

  这个插件允许你指定特定的汉字，将字体文件的其它汉字删除，生成精简后的字体文件。
  
  往往我们需要的汉字就是项目代码中出现的中文，你可以指定若干目录，插件会遍历目录下的文件，搜索出所有中文。
- 格式转换

  为了满足浏览器兼容性要求，在精简汉字的同时，可以转换生成多种字体格式，支持生成otf ttf eot woff woff2几种主流格式。
  
  
  字体格式转换基于 [font-min](https://github.com/ecomfe/fontmin)
- 支持

  适配使用webpack和postcss的项目

## 安装

```bash
npm install --save-dev font-optimize-vue-plugin-master
```


### 使用
   
 - 引入插件：
 
   **webpack-chain 配置方法**
    
   ```js
       const fontOptimizePlugin = require('font-optimize-vue-plugin-master')
       module.exports = {
        /*
        ...
        */
       configureWebpack: config => {
         config.plugin('fontSpider').use(fontSpiderPlugin, [
           {
             spiderDir: [path.resolve('./src/pages/privacyClause')],
             optimizeFileTypes: ['vue','js'],
             extraContents: '`~!@#$%^&*()_\\-+=<>?:"{}|,./;\'[]·~！@#￥%……&*（）——-+={}|《》？：“”【】、；‘\'，。、',
           }
         ])
       }
      }
   ```
   *参数说明：*
       
       - `spiderDir`: 可选。指定某个具体文件夹路径，将会遍历这个路径下的文件获取中文字符，
               类型是字符串或者多个字符串组成的数组，如果是数组会汇总所有数据。
       - `optimizeFileTypes`: 可选。遍历文件时只访问特定后缀的文件；类型是字符串组成的数组。
       - `extraContents`: 除了遍历文件获取汉字，可以额外指定特定的字符串，类型字符串。
       
       如果 spiderDir 和 extraContents 参数都为空 即未指定汉字，插件不会运行。


 - 代码使用：

   **找到你想处理的字体代码位置 比如下面的代码**
   
   ```css
   @font-face {
     font-family: 'AlibabaPuHuiTi';
     src: url('fonts/Alibaba-PuHuiTi-Medium.ttf');
   }
   ```
   
   **在路径后添加两个参数 optimize target**
   ```css
   @font-face {
     font-family: 'AlibabaPuHuiTi';
     src: url('fonts/Alibaba-PuHuiTi-Medium.ttf?optimize&target=woff2|woff');
   }
   ```
    
   **将会把这个字体文件按照插件中配置的内容精简化，最后生成的CSS代码将会类似于：**
   
   ```css
   @font-face {
     font-family: AlibabaPuHuiTi;
     src: url(../fonts/AlibabaPuHuiTi.55b70fb1.TTF) format('woff2'),url(../fonts/AlibabaPuHuiTi.034e7464.TTF) format('woff');
   }
   ```
   
   **参数说明：**
   - `optimize`: 必填，标识要精简这个字体文件。
   - `target`: 必填，指定输出的字体格式，多个格式中间用竖线分隔。

    
   





