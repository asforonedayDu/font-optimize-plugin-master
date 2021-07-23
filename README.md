
# font-optimize-plugin-master

这个webpack插件用于字体文件大小优化、字体格式转换以及相应的CSS代码适配。

只支持TTF/OTF/SVG格式作为原始字体，OTF字体无法精简，生成的其它格式可精简化。

字体处理基于 [font-min](https://github.com/ecomfe/fontmin)

联系作者：QQ729961328

### 详情

- 字体优化

  这个插件允许你指定特定的字符，将字体文件的其它字符删除，生成精简后的字体文件，或者不指定字符，自动用常用字符集优化。
  
- 格式转换

  为了满足浏览器兼容性要求，在精简字符的同时，可以转换生成多种字体格式，支持生成otf ttf eot woff woff2几种主流格式。
  
- 支持

  适配使用webpack和postcss的项目

## 安装

```bash
npm install --save-dev font-optimize-plugin-master
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
             extraContents: '',
             key:'',
           }
         ])
       }
      }
   ```
   
   **参数说明：**
     - `extraContents`:
        
        需要筛选的指定字符，其它字符将被去除。
      
        如果 extraContents 为空 即未指定字符，将会默认使用3000个常用字符。
     - `key`:
        
        指定处理特定的字体文件，只有字体文件的key相匹配才会优化。
      
        用于声明多个plugin插件，针对不同的字体文件进行不同的处理。
       
   **手动获取常用字符集：**
   - `commonCharacter3000` 为3000个常用中文字符加英文和标点符号
   - `commonCharacter7000` 覆盖更多的7000个中文字符：
   ```js
     const fontSpiderPlugin = require('font-optimize-plugin-master')
     const { commonCharacter7000, commonCharacter3000 } = fontSpiderPlugin    
   ```

 - 代码使用：

   **找到你想处理的字体代码位置 比如下面的代码**
   
   ```css
   @font-face {
     font-family: 'AlibabaPuHuiTi';
     src: url('fonts/Alibaba-PuHuiTi-Medium.ttf');
   }
   ```
   
   **在路径后添加三个参数 optimize target key**
   ```css
   @font-face {
     font-family: 'AlibabaPuHuiTi';
     src: url('fonts/Alibaba-PuHuiTi-Medium.ttf?optimize&target=woff2|woff&key=1');
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
   - `key`: 可为空，如果不为空，只有key值相同的插件实例才会优化这个字体。

    
   






