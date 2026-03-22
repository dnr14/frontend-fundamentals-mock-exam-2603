import { css } from '@emotion/react';
import { Spacing, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';

interface MessageBannerProps {
  type: 'success' | 'error';
  text: string;
}

const STYLE_MAP = {
  success: { background: colors.blue50, color: colors.blue600 },
  error: { background: colors.red50, color: colors.red500 },
};

export function MessageBanner({ type, text }: MessageBannerProps) {
  const style = STYLE_MAP[type];

  return (
    <div
      css={css`
        padding: 0 24px;
      `}
    >
      <div
        css={css`
          padding: 10px 14px;
          border-radius: 10px;
          background: ${style.background};
          display: flex;
          align-items: center;
          gap: 8px;
        `}
      >
        <Text typography="t7" fontWeight="medium" color={style.color}>
          {text}
        </Text>
      </div>
      <Spacing size={12} />
    </div>
  );
}
